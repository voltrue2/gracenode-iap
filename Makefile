init:

	@echo 'create git pre-commit hook'
	ln -s ../../lint.sh .git/hooks/pre-commit
	@echo 'adjust pre-commit hook file permission'
	chmod +x .git/hooks/pre-commit
	@echo 'install dependencies'
	npm install
	@echo 'done'

.PHONY: test-apple
test-apple:
	@echo 'test gracenode module iap apple:'
	./node_modules/mocha/bin/mocha test/index.js -R spec -b  --path=$(path) --service=apple

.PHONY: test-google
test-google:
	@echo 'test gracenode module iap google:'
	./node_modules/mocha/bin/mocha test/index.js -R spec -b  --key=$(key) --path=$(path) --service=google

