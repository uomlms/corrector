![C](https://img.shields.io/badge/c-%2300599C.svg?style=for-the-badge&logo=c&logoColor=white)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Kafka](https://img.shields.io/badge/Apache_Kafka-231F20?style=for-the-badge&logo=apache-kafka&logoColor=white)

# Corrector Service

Corrector Service is responsible for correcting the assignments that students submits. Does not provide endpoints, only Kafka Consumers and Producers.


## Bugs, Feature Requests and Contributing
We'd love to see community contributions. We like to keep it simple and use Github issues to track bugs and feature requests and pull requests to manage contributions.


## Kafka

### Event Flow Diagram

Corrector service consumes AssignmentSubmitEvent which indicates that an assignment has submitted. After correction, publishes AssignmentCorrectionEvent and SendMailEvent.

*Full list of Events can be found [here](/notyet).*

![event-flow](docs/event-flow.svg)


## Python Script

### Parameters

- Configuration File: the path of configuration file
- Submission File: the path of submission file

Example:
```
python3 corrector.py config_path submit_path
```
---
### Expected Return Values

Return value should be valid JSON **string** in stdout

Example:
```
# python3 code
return json.dumps({
   'result': "The actual result",
   'status': "success" | "partial-success" | "fail"
})
```
---


## Quickstart

### Using Docker Compose

#### Dependencies

- Docker
- Docker Compose

```
$ git clone https://github.com/uomlms/corrector.git
$ cd corrector
$ docker-compose up
```


## Authors

- [Orestis Rafail Nerantzis](https://github.com/OrestisNer)
- [Apostolis Tselios](https://github.com/apostolistselios)

## License
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)