import { Producer, Topics, SendMailEvent } from '@uomlms/common';

export class SendMailProducer extends Producer<SendMailEvent> {
    readonly topic = Topics.SendMailTopic;
}

