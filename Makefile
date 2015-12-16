BIN=node_modules/.bin

build: clean test
	$(BIN)/babel src --out-dir lib

clean:
	rm -rf lib

test: eslint
	BABEL_DISABLE_CACHE=1 $(BIN)/mocha --compilers js:babel-core/register

eslint:
	$(BIN)/eslint src

PHONY: build clean eslint
