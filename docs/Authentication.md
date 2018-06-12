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

### Search Guard
```
sentinl:
  settings:
    report:
      active: true
      authentication:
        enabled: true
        mode:
          searchguard: true
```

### X-Pack
```
sentinl:
  settings:
    report:
      active: true
      authentication:
        enabled: true
        mode:
          xpack: true
```

### Basic
```
sentinl:
  settings:
    report:
      active: true
      authentication:
        enabled: true
        mode:
          basic: true
```

### Custom
```
sentinl:
  settings:
    report:
      active: true
      authentication:
        enabled: true
        mode:
          custom: true
        custom: # you have to replace the following selectors with selectors found on your login page
          username_input_selector: '#username'
          password_input_selector: '#password'
          login_btn_selector: '#login-btn'
```

### Authentication per report
You can set different authentication modes per different reports. This can be added only in the Raw tab of watcher editor. 
```
...
  "actions": {
    "report_screenshot": {
      "throttle_period": "0h0m1s",
      "report": {
        ...
        "snapshot": {
          "res": "1920x1080",
          "url": "https://auth-demo.aerobaticapp.com/protected-standard/",
          "params": {
            "username": "aerobatic",
            "password": "aerobatic"
            "authentication": {
              "enabled": true,
              "mode": {
                "searchguard": true
              }
            }
          },
        }
      }
    }
...
""
```
