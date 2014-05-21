.PHONY: test-apple
test-apple:
	@echo 'test gracenode module iap apple:'
	./node_modules/mocha/bin/mocha test/iap/index.js -R spec -b  --path=$(path) --service=apple

.PHONY: test-google
test-google:
	@echo 'test gracenode module iap google:'
	./node_modules/mocha/bin/mocha test/iap/index.js -R spec -b  --key=$(key) --path=$(path) --service=google
