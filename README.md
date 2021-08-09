## Corrector Service
Corrector Service is responsible for correcting the assignmets.

## Python Script

Python Scipt should return a JSON in stdout in bellow format
```
{
    'result': "the output that will be printed to user.",
    'status': "success" or "fail"
}
```

## Producers

- AssignmentCorrectionProducer : Produces to AssignmentCorrectionTopic. 

## Consumers
 
- AssignmentSubmitConsumers : Listens to AssignmentSubmitTopic. 