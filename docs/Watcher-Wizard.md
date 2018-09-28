# Using the Wizard

SENTINL provides a built-in wizard to assist forming proper watchers using a _step-by-step_ sequence

#### Step 1: New Watcher
The first step is to give our Watcher a name and choose an execution frequency
<img src="http://i.imgur.com/WTtFrDx.png" >
#### Step 2: Input Query
The input query is the focal part of our watcher. Make sure time-range fields are dynamic
<img src="http://i.imgur.com/HxY0YHR.png" >
#### Step 3: Condition
Condition is used as a gate to validate if the results received back are worth processing
<img src="http://i.imgur.com/XF2eurd.png" >
#### Step 4: Transform
Our data might need adjustments or post processing. Process our payload using a javascript expression/script
<img src="http://i.imgur.com/TjpADFn.png" >
#### Step 5: Actions
Our data is ready! Let's form a notification using the mustache templating language
<img src="http://i.imgur.com/swzR4fo.png" >
#### Step 6: Expert Mode
Here's our fully formed SENTINL JSON watcher in its naked beauty
<img src="http://i.imgur.com/6CSyx59.png" >
