.PHONY: all test reuse

all: src/bin/md2pango

src/bin/md2pango: src/md2pango.js
	mkdir -p src/bin
	echo '#!/usr/bin/env node' > $@
	cat src/md2pango.js >> $@

TESTS=all
test:  ; ./tests/test.sh $(TESTS)
reuse: ; reuse addheader src/*.js -y 2021 -l MIT -c 'Uwe Jugel'	
