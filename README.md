# gracenode-iap Module (in-app-purchase)

In-App-Purchase module for gracenode framework.

This is designed to function within gracenode framework.

### Requirements

In order for gracenode-iap module to work properly, you need to add gracenode-mysql module to your application.

#### Before you start using gracenode-iap

gracenode-iap module uses mysql database to store validation data, you will need to create the required table for the module.

To create the required mysql table, you will need to execute the following SQL queries:

`gracenode-iap/schema.sql`

If you need to execute the queries from Node.js application, you may do:

```
var gracenode = require('gracenode');
gracenode.setConfigPath('path/to/your/config/dir/');
gracenode.setConfigFiles(['yourConfig.json']);
gracenode.use('gracenode-mysql');
gracenode.use('gracenode-iap');
gracenode.setup(function (error) {
	if (error) {
		return console.error(error);
	}
	gracenode.getModuleSchema('iap', function (error, sqlList) {
		if (error) {
			// hmm error
		}
		// execute the SQL queries in sqlList array here
	});
});
```

## How to include it in my project

To add this package as your gracenode module, add the following to your package.json:

```
"dependencies": {
	"gracenode": "",
	"gracenode-mysql": "",
	"gracenode-iap": ""
}
```

To use this module in your application, add the following to your gracenode bootstrap code:

```
var gracenode = require('gracenode');
// this tells gracenode to load the module
// make sure you load gracenode-mysql module BEFORE gracenode-iap module
gracenode.use('gracenode-mysql');
gracenode.use('gracenode-iap');
```

To access the module:

```
// the prefix gracenode- will be removed automatically
gracenode.iap
```

## Configurations
```javascript
"modules": {
        "iap": {
                "sandbox": true or false,
                "sql": "mysql module configuration name",
                "googlePublicKeyPath": "path to google play public key files" // the file names MUST be specific (for live: iap-live, for sandbox: iap-sandbox)
        }
}
```

###API: validateApplePurchase

<pre>
void validateApplePurchase(String receipt, Function cb)
</pre>

Sends an HTTPS request to Apple to validate the given receipt and responds back an object { validateState: 'validated' or 'error', status: 'pending' or 'handled' or 'canceled' }

###API: validateGooglePurchase

<pre>
void validateGooglePurchase(Object receipt, Function cb)
</pre>

Validates the receipt with public key using open SSL

###API: isValidated

<pre>
bool isValidated(Object validationResponse)
</pre>

Returns true if the response of the purchase validation is validated.

```javascript
gracenode.iap.validateApplePurchase(receipt, function (error, response) {
        if (error) {
                // handle error here
        }

        // check the validated state
        if (gracenode.iap.isValidated(response)) {
		// purchase has been validated
	}
});
```

###API: updateStatus

<pre>
void updateStatus(Mixed receipt, String status, Function cb)
</pre>
> Updates the status of the given receipt. the valid status are: pending, handled, canceled.

Example:
```javascript
// example code with iap module
gracenode.iap.validateApplePurchase(receipt, function (error, response) {
        if (error) {
                // handle error here
        }

        // check the validated state
        if (gracenode.iap.isValidated(response)) {
                // Apple has validated the purchase

                var hc = gracenode.wallet.create('hc');
                hc.addPaid(receipt, userId, itemPrice, itemValue,

                        // this callback will be called BEFORE the commit of "addPaid"
                        function (continueCallback) {

                                // update iap status to mark the receipt as "handled"
                                gracenode.iap.updateStatus(receipt, 'handled', function (error) {
                                        if (error) {
                                                // error on updating the status to "handled"
                                                return continueCallback(error); // this will make "addPaid" to auto-rollback
                                        }

                                        // iap receipt status updated to "handled" now commit
                                        continueCallback();

                                })

                        },

                        // this callback is to finalize "addPaid" transaction
                        function (error) {
                                if (error) {
                                        // error on finalizing the transaction
                                }

                                // we are done!
                        }

                );

        }

});
```
