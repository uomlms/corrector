import { Consumer, AssignmentSubmitEvent, Topics } from '@uomlms/common';
import { Message } from 'node-rdkafka';


export class AssignmentSubmitConsumer extends Consumer<AssignmentSubmitEvent> {
  readonly topic = Topics.AssignmentSubmitTopic;

  onMessage = (data: AssignmentSubmitEvent['data'], message: Message) => {
    console.log(data);
  }

}