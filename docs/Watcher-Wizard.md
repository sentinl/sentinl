# Using the Wizard

SENTINL provides a wizard to help create watchers using a _step-by-step_ sequence.

#### Step 1: New Watcher
The first step is to give our Watcher a name and choose an execution frequency. In this example, we choose to run every day. 

![Header](https://i.imgur.com/dBNU5Pf.png)

#### Step 2: Input Query and Condition
Here you specify the query parameters and the condition to trigger on, based on a date histogram aggregation.
In this example, the watcher will trigger an alert when there are more than two articles in an hour during the day.

![Query and condition](https://i.imgur.com/hlCBv8s.png)

In this section, you can also take a look at the search query sent to Elasticsearch, as well as the JSON representation of the watcher and the ability to convert to an advanced watcher.

#### Step 3: Actions
Time to send an alert! Here, you can setup a variety of actions to when your condition has been met.
In this example, we send a HTML-formatted email injected with data from the watcher and query response using the mustache templating language.

![Email action](https://i.imgur.com/FOiz09D.png)

