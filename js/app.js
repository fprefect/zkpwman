function EncStore(user, url, timeout) {
	this.user = user;
	this.storeurl = url;
	this.timeout = timeout; // in seconds

	var self = this;
	var _data = false;
	var _enc = false;

	var aes = new pidCrypt.AES.CBC();
	var aes_opts = {nBits:256};
	
	this.decryptData = function(cb) {
		if(_data) { cb(); return; }
		self.getKey(function(key) {
			var json = aes.decryptText(_enc, key, aes_opts);
			try { var obj = JSON.parse(json); _data = obj; }
			catch(SyntaxError) { self.getKey(arguments.callee, true); return; }
			setTimeout(function() { _data = false; }, timeout*1000);
			cb();
		});
	};

	this.load = function(cb) {
		$.get(storeurl, {user:user}, function(data, textStatus) { 
			if(textStatus != 'success') { return alert("Load error: " + textStatus); }
			_enc = data;
			self.decryptData(function() { cb(_data); });
		},'text');
	};

	this.get = function(id, cb) {
		self.decryptData(function() { 
			cb((!id in _data)?false:_data[id]);
		});
	};

	this.add = function(id, data, cb) {
		self.decryptData(function() {
			_data[id] = data;
			self.save(cb);
		});	
	};

	this.del = function(id, cb) {
		self.decryptData(function() {
			delete _data[id];
			self.save(cb);
		});	
	};

	this.save = function(cb) {
		self.getKey(function(key) {
			self.decryptData(function() {
				var json = JSON.stringify(_data);
				_enc = aes.encryptText(json, key, aes_opts);
				$.post(storeurl+'?user='+user, _enc, function(resp, textStatus) {
					if(textStatus != 'success') { return alert("Post error: " + textStatus); }
					cb();
				});
			});
		});
	};
	
	this.getKey = function(fn) {
		var setkeyfn = function() {
			var key = $('#form-pw-pw').val();
			$.modal.close();
			fn(key);
		};
		$('#form-pw').modal({
			minHeight: '80px',
			minWidth: '100px',
			position: ['8px','7px'],
			onShow:function(dialog) { 
				$('#form-pw-pw').select().focus().keypress(function(e) {
					if(e.keyCode == 13) { // enter key
						e.preventDefault();
						setkeyfn();
					}
				}); 
				$('#form-pw-submit').click(setkeyfn);
			} 
		});
	};
	return this;
};

$(function() {
	var self = this;
	var user = document.location.search.replace(/^\?(user=)?/, '');
	var store = EncStore(user, 'rev.php', 3*60);

	this.appendEntry = function(name) {
		var html =	'<div>' +
					'<h3 rel="'+name+'">+ ' + name + '<span class="actions">' +
					' <a href="#" class="action-edit"><span>Edit</span></a>' +
					' <a href="#" class="action-del"><span>Delete</span></a>' +
					'</span></h3>' +
					'<div style="display:none;"/>' +
					'</div>';
		$('#entry-list').append(html);
	};

	this.renderObjTo = function(obj, container) {
		var html = [];
		$.each(obj, function(k,v) {
			if(k == 'class') { return true; }
			if(k == 'link') {
				html.push('<a href="'+v+'">Website</a>');
			} else if(k == 'pass' || k == 'password') {
				html.push('<span class="key">'+k.charAt(0).toUpperCase() + k.substr(1) + ':</span> <input type="text" class="pw" value="'+v+'"/>');
			} else {
				html.push('<span class="key">'+k.charAt(0).toUpperCase() + k.substr(1) + ':</span> ' + v);
			}
		});
		$(container).append(html.join('<br>'));
	};

	this.collectData = function(frm) {
		var data = {};
		$(frm).find('input, select, textarea').each(function() {
			data[$(this).attr('name')] = $(this).val();
		});
		return data;
	};

	this.clearData = function(frm) {
		$(frm).find('input, select, textarea').each(function () { $(this).val(''); });
	};

	/*
	** Attach events
	*/
	// EVENT: Add item
	$('#new-item-but').click(function() {
		var data = self.collectData('#form-add');
		var name = data.name; delete data.name;
		store.add(name, data, function() {
			self.appendEntry(name);
			self.clearData('#form-add');
			$('#add-entry').click(); // hide the entry form
		});
		return false;
	});

	// EVENT: Delete item
	$('a.action-del').live('click', function(e) {
		e.preventDefault();
		var en = $(this).closest('div');
		id = $(this).closest('h3').attr('rel');
		if(!id) { return false; }
		store.del(id, function() {
			en.remove();
		});
		return false;
	});

	// EVENT: edit item
	$('a.action-edit').live('click', function(e) {
		e.preventDefault();
		return false;
	});

	// EVENT: Expand/contract item
	$('#entry-list h3').live('click', function(e) {
		var id;
		e.preventDefault();
		if($(this).data('expanded')) { // Contract
			id = $(this).attr('rel');
			$(this).data('expanded', false).blur().html("+"+$(this).html().substr(1)).siblings().eq(0).hide();
			if(id) { $(this).siblings().eq(0).contents().remove(); }
		}
		else { // Expand
			var h3 = this;
			id = $(this).attr('rel');
			$(h3).data('expanded', true).blur().html("-"+$(h3).html().substr(1));
			// If it doesnt look like an entry, just display the contents.
			if(!id) { $(h3).siblings().eq(0).show(); return; }
			store.get(id, function(obj) {
				self.renderObjTo(obj, $(h3).siblings().eq(0));
				$(h3).siblings().eq(0).show().find('input.pw').focus().select().blur(function() { $(this).replaceWith('<span>******</span>'); });
			});
		}
	});

	
	/*
	** Lets begin...
	*/
	document.title = document.title += ": " + user;
	
	store.load(function(data) {
		keys = [];
		for(k in data) { keys.push([k,k.toLowerCase()]); }
		keys.sort(function(a,b){
			if (a[1] > b[1]) return 1;
			if (a[1] < b[1]) return -1 
		  	return 0; 
		});
		for(k in keys) { 
			self.appendEntry(keys[k][0]); 
		}
	});
});
