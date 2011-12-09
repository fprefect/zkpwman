
INSTALLDIR=.

JSMIN = python ./js/jsmin.py

JSFILES = js/jquery-1.4.min.js js/jquery.simplemodal-1.3.3.min.js js/json2.js \
		  js/pidcrypt/pidcrypt.js js/pidcrypt/pidcrypt_util.js js/pidcrypt/md5.js \
		  js/pidcrypt/aes_core.js js/pidcrypt/aes_cbc.js \

js/all-min.js: $(JSFILES)
	cat $(JSFILES) | $(JSMIN) > js/all-min.js

all: js/all-min.js

$(INSTALLDIR)/pw.sqlite:
	sqlite3 $@ < create-db.sql
	chmod 666 $@

install: $(INSTALLDIR)/pw.sqlite js/all-min.js index.html store.php style.css
	cp index.html store.php style.css $(INSTALLDIR)/
	mkdir -p $(INSTALLDIR)/js
	cp js/all-min.js $(INSTALLDIR)/js/
	mkdir -p $(INSTALLDIR)/imgs
	cp imgs/* $(INSTALLDIR)/imgs/
