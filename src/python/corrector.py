import sys
import os
import configparser
import json
import pathlib
import subprocess
import pexpect
import decimal


class Corrector:
    """Corrects an assignment based on .ini file."""

    def __init__(self, config_file, source_file):
        self.config_file = config_file
        self.source_file = source_file
        self.set_settings()

    def set_settings(self):
        """Reads settings from .ini file"""

        config = configparser.ConfigParser()
        config.read(self.config_file)

        self.settings = {}
        if config.has_option("Settings", 'CompilationParameters'):
            self.settings['CompilationParameters'] = config["Settings"]['CompilationParameters'].split(
                ",")
            # Add roberts lib as parameter for gcc compilation
            self.settings['CompilationParameters'].extend((
                f"-I{os.environ['ROBERTS_LIB']}/include",
                "-lm",
                f"{os.environ['ROBERTS_LIB']}/lib/roberts.lib"
            ))

        if config.has_option("Settings", 'SolutionsPath'):
            self.settings['SolutionsPath'] = config["Settings"]['SolutionsPath']

        if config.has_option("Settings", 'SolutionKeyWords'):
            self.settings['SolutionKeyWords'] = [
                x.split(",") for x in config["Settings"]['SolutionKeyWords'].upper().split(":")]

        if config.has_option("Settings", 'InputPath'):
            self.settings['InputPath'] = config["Settings"]['InputPath']

        if config.has_option("Settings", 'InputExercises'):
            self.settings['InputExercises'] = config["Settings"]['InputExercises'].split(
                ":")

        if config.has_option("Settings", 'CMDInput'):
            cmd_input = [x.split(",") for x in config["Settings"]['CMDInput'].replace(
                "escaped_hash", "#").split(":")]
            self.settings['CMDInput'] = cmd_input

        if config.has_option("Settings", 'CMDResponse'):
            self.settings['CMDResponse'] = [
                x.split(",") for x in config["Settings"]['CMDResponse'].lower().split(":")]
        if config.has_option("Settings", 'Ordered'):
            self.settings['Ordered'] = config["Settings"]['Ordered']
        if config.has_option("Settings", 'MinFunctions'):
            self.settings['MinFunctions'] = config["Settings"]['MinFunctions']
        else:
            self.settings['MinFunctions'] = 1

    def compile(self):
        """
          Compiles .c source file with gcc. Exports and .exe file in same directory with source file.
          Returns the stdout and stderr of the gcc execution.
        """

        path, filename = os.path.split(os.path.abspath(self.source_file))
        # replace extension with .exe to filename
        filename = pathlib.Path(filename).with_suffix('.exe')
        self.exe_file = f"{path}/{filename}"
        compile_parameters = [
            "gcc",
            self.source_file
        ] + self.settings["CompilationParameters"] + ["-o", self.exe_file]

        # run gcc command
        gcc_compile = subprocess.run(
            compile_parameters,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        # returns stdout and stderr output
        return gcc_compile.stdout.decode('utf-8'), gcc_compile.stderr.decode('utf-8')

    def get_setting(self, key):
        """Returns the key's value from settings"""
        try:
            return self.settings[key]
        except:
            return None

    @staticmethod
    def exit(result, status='fail', exit_code=-1):
        response = {
            'result': result,
            'status': status
        }
        # prints to stdout
        print(json.dumps(response))
        sys.stdout.flush()
        # exits with code
        exit(exit_code)

    def evaluate_output(self, desired_output, produced_output):
        """Evaluates the output based on 'Ordered' setting"""

        ordered = self.get_setting('Ordered')
        if ordered and ordered == "True":
            return self.evaluate_ordered_output(desired_output, produced_output)
        else:
            return self.evaluate_unordered_output(desired_output, produced_output)

    def evaluate_unordered_output(self, desired_output, produced_output):
        """Evalueats the output without order"""

        produced_output = produced_output.lower()
        counter = 0
        for k in desired_output:
            position = produced_output.find(k.lower())
            if position != -1:
                counter += 1
        return counter

    def evaluate_ordered_output(self, desired_output, produced_output):
        """Evalueats the output with order"""

        produced_output = produced_output.lower()
        counter = 0
        found_pos = 0
        prev_pos = 0
        for k in desired_output:
            prev_pos = found_pos
            found_pos = produced_output.find(k.lower(), max(found_pos, 0))
            if found_pos != -1:
                counter += 1
                found_pos += len(k)
            else:
                found_pos = prev_pos

        return counter

    def test_with_cmd_input(self):
        """
          Tests with CMD inputs. Executes the .exe, send input lines and
          checks if the result is the expected, based on CMD Response
        """
        cmd_input = self.get_setting("CMDInput")
        if not cmd_input:
            Corrector.exit("CMDInput not defined")

        cmd_responses = self.get_setting("CMDResponse")
        if not cmd_responses:
            Corrector.exit("CMDResponse not defined")

        # counts the total responses from settings
        correct_matches = sum(map(len, cmd_responses))

        # matches counts the response's match
        matches = 0
        self.result = ""

        for index, _inputs in enumerate(cmd_input):
            buffer = f"\n=== EXECUTION. TEST #{str(index + 1)} === \n"
            if len(_inputs) > 0:

                # start .exe execution
                executor = pexpect.spawn(self.exe_file)

                for _input in _inputs:
                    executor.expect(['', '.* ', '.*  \r\n', pexpect.EOF])
                    # send cmd input
                    executor.sendline(_input)
                    buffer += executor.before.decode("latin-1") + \
                        executor.after.decode("latin-1")

                final_output = executor.expect(
                    [pexpect.TIMEOUT, '.*  \r\n', pexpect.EOF], timeout=2)
                if final_output == 2:
                    buffer += executor.before.decode("latin-1")
                elif final_output == 1:
                    buffer += executor.before.decode("latin-1") + \
                        executor.after.decode("latin-1")
                else:
                    buffer += executor.before.decode("latin-1")
                    self.result += "\n<b><u>EXECUTION TIMED OUT --> KILLED</u></b>\n"

                # add matches
                matches += self.evaluate_output(cmd_responses[index], buffer)
                self.result += buffer

        if matches == correct_matches:
            grade = 10
            status = "success"
        elif matches == 0:
            grade = 0
            status = "fail"
        elif matches < correct_matches:
            grade = 10 * round(decimal.Decimal(matches/correct_matches), 2)
            status = "partially-success"
        else:
            Corrector.exit(
                f"Unexpected error: Found {matches} out of {correct_matches} matches in responses.")

        self.result += f"\n=== EXECUTION RESULT: {status}. Grade: {grade} ==="
        Corrector.exit(self.result, status, 0)

    def test(self):
        solution_keywords = self.get_setting('SolutionKeyWords')
        if solution_keywords and len(solution_keywords) > 0:
            print('SolutionKeyWords')

        cmd_input = self.get_setting('CMDInput')
        if cmd_input and len(cmd_input) > 0:
            self.test_with_cmd_input()


def read_argv(argv):
    """Reads the config and source file from argvs"""
    try:
        config_file = argv[0]
        source_file = argv[1]
        return config_file, source_file
    except:
        Corrector.exit(
            "Invalid arguments when running corrector. e.g python corrector.py settingsPath sourcePath.")


def main(argv):
    if 'ROBERTS_LIB' not in os.environ:
        raise Exception('Roberts library is not defined')

    config_file, source_file = read_argv(argv)
    corrector = Corrector(config_file, source_file)
    stdout, stderr = corrector.compile()
    if (stderr):
        Corrector.exit(f"Compilation failed: {stderr}")

    corrector.test()


if __name__ == "__main__":
    main(sys.argv[1:])
