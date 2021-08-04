import { Producer, Topics, AssignmentCorrectionEvent } from '@uomlms/common';

export class AssignmentCorrectionProducer extends Producer<AssignmentCorrectionEvent> {
    readonly topic = Topics.AssignmentCorrectionTopic;
}

