Sentinl supports authentication via [Search Guard](https://github.com/floragunncom/search-guard). There are several options available.

# Authenticate search request

**Kibana**

1. Authenticate Sentinl via single user - `sg_kibana_server`. Look this [example.](Sentinl-in-Kibana-Searchguard-5.5.2-demo)

**Siren Platform (former Kibi)**

2. Authenticate Sentinl via single user - default `sentinl` from Access Controll app. For example, default kibi.yml
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

**Kibana or Siren Platform**

Also, there is a possibility to create multiple user credentials and assign these credentials to watchers, one credential per watcher. Thus authenticating each watcher separately. It is called impersonation. The credentials should be created in Search Guard and the required permissions should be assigned.

Then, put the following configuration inside kibana.yml
```
sentinl:
  settings:
    authentication:
      enabled: true 
      mode: 'basic'
      https: true
      admin_username: 'sentinl'
      admin_sha: '6859a748bc07b49ae761f5734db66848' 
      user_index: 'sentinl_users'
      user_type: 'user' 
      verify_certificate: false
      path_to_pem: '/home/kibi/.pem/sentinl.pem'
      encryption:
        algorithm: 'aes256'
        key: 'b9726b04608ac48ecb0b6918214ade54'
        iv_length: 16
```

Where `admin_username` is Sentinl system user which should be added manualy in Search Guard. Create admin password hash `admin_sha` using `sentinl/scripts/encryptPassword.js` script. For this, edit variable `plainTextPassword` value, replacing 'admin' with your password. Copy the generated hash and paste as the `admin_sha` value. 

The index defined by `user_index` holds user documents, each one with username and sha hash. Set `verify_certificate` to `false` while using a self-signed certificate. Also, you can change password hashing complexity tunning options inside `encryption`. [Node.js crypto library](https://nodejs.org/api/crypto.html) is used to hash and unhash user password.

Finally, insert the user credentials into `username` and `password` input fields in the General tab of the watcher UI editor. 
![screenshot from 2017-12-14 15-52-04](https://user-images.githubusercontent.com/5389745/33998197-20f662b6-e0e7-11e7-8201-d22ec9937960.png)
Note, these fields are visible only when the impersonation authentication type is `enabled: true`. The fields are one-way only, you can insert credentials but you don't see them. This was done to prevent other Sentinl admins to see the credentials set by you.  

# Authenticate report