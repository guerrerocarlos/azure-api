BIN=node_modules/.bin

build: clean
	$(BIN)/babel src --out-dir lib

clean:
	rm -rf lib

test: eslint

eslint:
	$(BIN)/eslint src

PHONY: build clean eslint
