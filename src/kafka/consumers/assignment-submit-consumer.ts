import { Consumer, AssignmentSubmitEvent, Topics, kafka } from '@uomlms/common';
import { Message } from 'node-rdkafka';
import { AssignmentCorrectionProducer } from '../producers/assignment-correction-producer';


export class AssignmentSubmitConsumer extends Consumer<AssignmentSubmitEvent> {
  readonly topic = Topics.AssignmentSubmitTopic;

  onMessage = (data: AssignmentSubmitEvent['data'], message: Message) => {
    console.log(data);
    new AssignmentCorrectionProducer(kafka.producer).produce({
      assignmentId: data.assignmentId,
      userId: data.userId,
      status: "sucess",
      result: "I corrected the assignment"
    })
  }

}