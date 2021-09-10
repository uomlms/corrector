import { Consumer, AssignmentSubmitEvent, Topics, kafka, verifyToken } from '@uomlms/common';
import { AssignmentCorrectionProducer } from '../producers/assignment-correction-producer';
import { SendMailProducer } from '../producers/send-mail-producer';
import { correctAssignment } from '../../controllers/correct-assignment';

export class AssignmentSubmitConsumer extends Consumer<AssignmentSubmitEvent> {
  readonly topic = Topics.AssignmentSubmitTopic;

  onMessage = async (data: AssignmentSubmitEvent['data'], message: any) => {
    // return early if not config file in assignment
    if (!data.configFile) { return; }

    const { status, result } = await correctAssignment(data.submissionId, data.configFile, data.sourceFile);
    console.log("Python Result: ", result);

    new AssignmentCorrectionProducer(kafka.producer).produce({
      assignmentId: data.assignmentId,
      submissionId: data.submissionId,
      status,
      result
    });

    const user = verifyToken(data.user.token);
    if (user) {
      new SendMailProducer(kafka.producer).produce({
        to: user.email,
        subject: `[${status}] Result from submission ${data.submissionId}`,
        text: `Corrector output: ${result}`
      });
    }
  }
}