Sentinl supports authentication via [Search Guard](https://github.com/floragunncom/search-guard). There are several options available.

# Authenticate search request

**Kibana**
[Elasticsearch basic authentication](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/auth-reference.html) is used for authentication. 

Valid certificate
```
sentinl:
  settings:
    authentication:
      enabled: true 
      username: 'elastic'
      password: 'password'
      cert:
        selfsigned: false
        pem: '/path/to/pem/key'
```

Self-signed certificate
```
sentinl:
  settings:
    authentication:
      enabled: true 
      username: 'elastic'
      password: 'password'
      cert:
        selfsigned: true
```

**Siren Platform (former Kibi)**

Authentication via single user - default `sentinl` from Access Controll app. For example, default kibi.yml
```
# Access Control configuration
kibi_access_control:
  enabled: true
  cookie:
    password: "12345678123456781234567812345678"
  admin_role: kibiadmin
  sentinl:
    elasticsearch:
      username: sentinl
      password: password
...
```

**Impersonation**

There is a possibility to create multiple user credentials and assign these credentials to watchers, one credential per watcher. Thus authenticating each watcher separately. It is called impersonation. 

1. Create credentials in Search Guard or X-Pack and assign permissions you need.

You need one user for Sentinl and one user per watcher.

2. Set Sentinl authentication
```
sentinl:
  settings:
    authentication:
      enabled: true 
      impersonate: true
      username: 'elastic'
      password: 'password'
      sha: '6859a748bc07b49ae761f5734db66848'
      cert:
        selfsigned: true
```

Set password as clear text in `password` property. The password can be put in encrypted form instead. Set password hash in `sha` property, now you can remove `password` option. 

Use `sentinl/scripts/encryptPassword.js` script to obtain the hash. Edit variable `plainTextPassword` value, replacing `admin` with your password. Copy the generated hash and paste as the `sha` value. Also, you can change password hashing complexity tunning options inside `encryption`. [Node.js crypto library](https://nodejs.org/api/crypto.html) is used to hash and unhash user password.

3. Set watcher authentication 

Create a sha hash of the watcher password using `encryptPassword.js`. Put it into `password` input field and username into `username` field. Note, these fields are visible only when the impersonation is enabled `impersonate: true`. The fields are one-way only, you can insert credentials but you don't see them. It is to prevent other Sentinl admins to see the credentials set by you.  
![screenshot from 2017-12-14 15-52-04](https://user-images.githubusercontent.com/5389745/33998197-20f662b6-e0e7-11e7-8201-d22ec9937960.png)


# Authenticate report

Both username and password should be set in the report action in UI.

## Kibana configuration for Sentinl v5
In the Sentinl v5 report authentication is set systemwide and applied for all watchers. It is not possible to set unique authentication per watcher.

### Search Guard
```
sentinl
  settings
    report
      active: true
      search_guard: true
```

### Basic
```
sentinl
  settings
    report
      active: true
      simple_authentication: true
```

## Kibana configuration for Sentinl v6+
In the Sentinl v6 report unique authentication is set per watcher.

### Basic authentication
```
{
  "actions": {
    "report_admin": {
      "throttle_period": "0h0m1s",
      "report": {
        "to": "sergibondarenko@gmail.com",
        "from": "trex@beast",
        "subject": "My Report",
        "priority": "high",
        "body": "Sample Screenshot Report",
        "save": true,
        "auth": {
          "active": true,
          "mode": "basic",
          "username": "user",
          "password": "passwd"
        },
        "snapshot": {
          "res": "1920x1080",
          "url": "http://httpbin.org/basic-auth/user/passwd",
          "params": {
            "delay": 5000,
            "crop": "false"
          },
          "type": "png"
        }
      }
    }
  },
  "input": {
    "search": {
      "request": {
        "index": [],
        "body": {}
      }
    }
  },
  "condition": {
    "script": {
      "script": "payload.hits.total >= 0"
    }
  },
  "transform": {},
  "trigger": {
    "schedule": {
      "later": "every 1 hour"
    }
  },
  "disable": true,
  "report": true,
  "title": "reporter_title"
}
```

### Custom login page authentication
Sentinl uses CSS selectors to find page login form controls: username, password and login button.
```
{
  "actions": {
    "report_admin": {
      "throttle_period": "0h0m1s",
      "report": {
        "to": "sergibondarenko@gmail.com",
        "from": "trex@beast",
        "subject": "My Report",
        "priority": "high",
        "body": "Sample Screenshot Report",
        "save": true,
        "auth": {
          "active": true,
          "mode": "customselector",
          "username": "admin",
          "password": "12345",
          "selector_username": "form input[id='usr']",
          "selector_password": "form input[id='pwd']",
          "selector_login_btn": "form input[type='submit']"
        },
        "snapshot": {
          "res": "1920x1080",
          "url": "http://testing-ground.scraping.pro/login",
          "params": {
            "delay": 5000,
            "crop": "false",
            "username": "elastic",
            "password": "password"
          },
          "type": "png"
        }
      }
    }
  },
  "input": {
    "search": {
      "request": {
        "index": [],
        "body": {}
      }
    }
  },
  "condition": {
    "script": {
      "script": "payload.hits.total >= 0"
    }
  },
  "transform": {},
  "trigger": {
    "schedule": {
      "later": "every 1 hour"
    }
  },
  "disable": true,
  "report": true,
  "title": "reporter_title"
}
```

### SearchGuard authentication
It is essentially same as the authentication above except CSS selectors here are hardcoded in the Sentinl part of Kibana configuration.
You can change the selectors if they don't work for you. For details look the [advanced configuration report part](Config-Example.md). 
```
{
  "actions": {
    "report_admin": {
      "throttle_period": "0h0m1s",
      "report": {
        "to": "sergibondarenko@gmail.com",
        "from": "trex@beast",
        "subject": "My Report",
        "priority": "high",
        "body": "Sample Screenshot Report",
        "save": true,
        "auth": {
          "active": true,
          "mode": "searchguard",
          "username": "admin",
          "password": "12345"
        },
        "snapshot": {
          "res": "1920x1080",
          "url": "http://testing-ground.scraping.pro/login",
          "params": {
            "delay": 5000,
            "crop": "false",
            "username": "elastic",
            "password": "password"
          },
          "type": "png"
        }
      }
    }
  },
  "input": {
    "search": {
      "request": {
        "index": [],
        "body": {}
      }
    }
  },
  "condition": {
    "script": {
      "script": "payload.hits.total >= 0"
    }
  },
  "transform": {},
  "trigger": {
    "schedule": {
      "later": "every 1 hour"
    }
  },
  "disable": true,
  "report": true,
  "title": "reporter_title"
}
```

### Kibana X-Pack authentication
It is essentially same as the authentication above except CSS selectors here are hardcoded in the Sentinl part of Kibana configuration.
You can change the selectors if they don't work for you. For details look the [advanced configuration report part](Config-Example.md). 
```
{
  "actions": {
    "report_admin": {
      "throttle_period": "0h0m1s",
      "report": {
        "to": "sergibondarenko@gmail.com",
        "from": "trex@beast",
        "subject": "My Report",
        "priority": "high",
        "body": "Sample Screenshot Report",
        "save": true,
        "auth": {
          "active": true,
          "mode": "xpack",
          "username": "admin",
          "password": "12345"
        },
        "snapshot": {
          "res": "1920x1080",
          "url": "http://testing-ground.scraping.pro/login",
          "params": {
            "delay": 5000,
            "crop": "false",
            "username": "elastic",
            "password": "password"
          },
          "type": "png"
        }
      }
    }
  },
  "input": {
    "search": {
      "request": {
        "index": [],
        "body": {}
      }
    }
  },
  "condition": {
    "script": {
      "script": "payload.hits.total >= 0"
    }
  },
  "transform": {},
  "trigger": {
    "schedule": {
      "later": "every 1 hour"
    }
  },
  "disable": true,
  "report": true,
  "title": "reporter_title"
}
```
