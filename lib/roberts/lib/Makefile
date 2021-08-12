.PHONY: default

default: genlib.o exception.o exception.o graphics.o random.o simpio.o strlib.o 
	ar rcs roberts.lib genlib.o exception.o graphics.o random.o simpio.o strlib.o 

genlib.o: genlib.c
	gcc -c genlib.c -I../include

exception.o: exception.c
	gcc -c exception.c -I../include 

graphics.o: graphics.c
	gcc -c graphics.c -I../include 

random.o: random.c
	gcc -c random.c -I../include 

simpio.o: simpio.c
	gcc -c simpio.c -I../include 

strlib.o: simpio.c
	gcc -c strlib.c -I../include 

clean:
	rm -f *.o roberts.lib


