import * as amqp from "amqplib/callback_api";

amqp.connect("amqp://127.0.0.1", (err0, connection) => {
  if (err0) {console.log(err0); throw err0};
  connection.createChannel((err1, channel) => {
    if (err1) throw err1;
    var queue = "journey_v1";
    channel.assertQueue(queue, {
      durable: false,
    });
    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);
    channel.consume(
      queue,
      (message) => {
        console.log(" [x] Received message: ", message.content.toString());
      },
      { noAck: false }
    );
  });
});
