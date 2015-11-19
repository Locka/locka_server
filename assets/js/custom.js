function insertDataDashboard(data){
	deviceList.clear();
	deviceList.draw();

	$.each(data,function(){
		if(this['state'] == 'closed'){
			var $lock = '<span title="Open"><i onclick="door(\'open\','+ this['id'] + ')" class="fa fa-unlock-alt"> </i></span>';
		} else {
			var $lock = '<span title="Close"><i onclick="door(\'close\','+ this['id'] + ')" class="fa fa-lock"> </i></span>';
		}
		var actionBar = '<span title="Video"><i class="fa fa-camera"></i></span>'+$lock+'<span title="Informations"> <i onclick="openEditDevice('+this['id']+',\''+this['name']+'\')" class="fa fa-info"></i></span><span title="Share"><i onclick="openShareModal('+this['id']+')" class="fa fa-retweet"></i></span>';
		var connected = '<div style="width:15px; height:15px; background:#f44336; border-radius:7.5px;"></div>';

		deviceList.row.add([this['id'], this['name'], this['lock']['identifier'], this['state'], actionBar, connected]).draw( false );
	});
}

function insertDataLog(data){
	logList.clear();
	logList.draw();
	$.each(data,function(i){
		// Format Date
		var date = moment(data[i]['updatedAt']).format("DD/MM/YYYY HH:mm");

		if(!data[i]['device']){
			var name = "deleted";
		} else {
			var name = data[i]['device']['name'];
		}
		logList.row.add([data[i]['user']['username'], name, data[i]['type'], data[i]['description'], date]).draw( false );
	});
}

function insertDataStats(dataToProcess){
	var openLocks = 0;
	var closedLocks = 0;
	var table = [];
	$.each(dataToProcess,function(i){
		if(dataToProcess[i].state=='open') {
			openLocks++;
		}
		if(dataToProcess[i].state=='closed') {
			closedLocks++;
		}
	});
	if(closedLocks + openLocks == 0) {
		$('#opn_clsd_stat').highcharts({
			chart: {
				backgroundColor: 'transparent',
				plotBorderWidth: null,
				plotShadow: false,
				type: 'pie'
			},
			title: {
				text: 'Open and closed locks'
			},
			tooltip: {
				pointFormat: '{series.label}: <b>{point.percentage}</b>'
			},
			plotOptions: {
				pie: {
					allowPointSelect: true,
					cursor: 'pointer',
					width: '100%',
					dataLabels: {
						enabled: true
					},
					showInLegend: false
				}
			},
			series: [{
				name: 'Count',
				colorByPoint: true,
				data: []
			}]
		});
	} else {
		$('#opn_clsd_stat').highcharts({
			chart: {
				style: {
					color: "#fff"
				},
				backgroundColor: 'transparent',
				plotBorderWidth: null,
				plotShadow: false,
				type: 'pie'
			},
			title: {
				style: {
					color: "#fff"
				},
				text: 'Open and closed locks'
			},
			tooltip: {
				pointFormat: '{series.name}: <b>{point.y}</b>'
			},
			plotOptions: {
				pie: {
					allowPointSelect: true,
					cursor: 'pointer',
					dataLabels: {
						enabled: true
					},
					showInLegend: false
				},
				series: {
					dataLabels: {
						color: '#fff'
					},
				},
			},
			series: [{
				name: 'Count',
				colorByPoint: true,
				data: [
					{name: "Open", y: openLocks},
					{name: "Closed", y: closedLocks}
				]
			}],
			credits: {
				enabled: false
			},
		});
	}
}

// Notification center
function notification(type, text) {
	if(type != null && text != null){
		switch(type){
			case 'add':
				Materialize.toast('Add : ' + text, 4000);
				break;
			case 'update':
				Materialize.toast('Update : ' + text, 4000);
				break;
			case 'del':
				Materialize.toast('Delete : ' + text, 4000);
				break;
			case 'open':
				Materialize.toast(text, 4000);
				break;
			case 'close':
				Materialize.toast(text, 4000);
				break;
			default:
				Materialize.toast("Error : type isn't defined => " + type, 4000);
				break;
		}
	} else {
		Materialize.toast("Error, your notification is unkonwn by system", 4000)
	}
}

// Lock function
function door(action, id) {
	if(action != null || (action == 'open' || action == 'close')) {
		if(id != null){
			$.get('/device/'+action, {id: id});
		} else {
			Materialize.toast('Id inconnu', 4000)
		}
	} else {
		Materialize.toast('Action inconnu ', 4000)
	}
}

// Get all logs and devices
function getAllDataForDashboard(){
	$.get("/user/getDevicesByUser", function(data) {
		if(data.length != 0){
			var promises = [];
			var array = data;
	
			$.each(data,function(i){
				var promise = $.get( "/lock/"+data[i]['identifier']).done(function(lock){array[i]['lock'] = lock});
				promises.push(promise);
			});
	
			$.when.apply($, promises).done(function() {
				insertDataDashboard(array.sort(function(a,b) {
					if(a.createdAt > b.createdAt){
						return -1
					}
					if(a.createdAt < b.createdAt){
						return 1
					}
					return 0
					})
				);
		  });	
		} else {
			insertDataDashboard([]);
		}
	});
}

function getAllDataLogs(){
	$.get( '/device/logs').done(function(logs) {
		insertDataLog(logs.sort(function(a,b) {
				if(a.createdAt > b.createdAt){
					return -1
				}
				if(a.createdAt < b.createdAt){
					return 1
				}
				return 0
			})
		);
	});
}

/*
function getAllDataStats(){
	$.get("/user/getDevicesByUser", function(array) {
		insertDataStats(array);
	});
}
*/

// Socket IO //
io.socket.on('connect', function(){
	console.log("Connected...");

	// Subscribe events
	io.socket.get('/socket/devices/subscribe');
	io.socket.get('/socket/users/logs/subscribe');

	// Monitor device Model
	io.socket.on("device", function(data){
		switch(data.verb) {
			case 'created':
				getAllDataForDashboard();
// 				getAllDataStats();
				break;
			case 'destroyed':
				getAllDataForDashboard();
// 				getAllDataStats();
				break;
			case 'removedFrom':
				console.log('Switch error');
				break;
			case 'updated':
				getAllDataForDashboard();
// 				getAllDataStats();
				break;
			default:
				notification('error', 'error switch');
				break;
		}
	});
	// Monitor log Model
	io.socket.on("log", function(data){
		console.log(data)
		if(data){
			log = data.data.log;
			switch(data.verb) {
		    case 'created':
	    		switch(log.type){
		    		case 'Create':
		    			notification('add', log.description);
		    			getAllDataLogs();
		    			break;
		    		case 'Update':
		    			notification('update', log.description);
		    			getAllDataLogs();
		    			break;
		    		case 'Delete':
		    			notification('del', log.description);
		    			getAllDataLogs();
		    			break;
		    		case 'Open':
		    			notification('open', log.description);
		    			getAllDataLogs();
		    			break;
		    		case 'Close':
		    			notification('close', log.description);
		    			getAllDataLogs();
		    			break;
		    		default:
		    			notification('error', 'error log type');
		    			getAllDataLogs();
		    			break;
		    	}
			}
		}
	});
	// Get All data
	getAllDataForDashboard();
	getAllDataLogs();
	getAllDataStats();
});


// Init
// Device table
var deviceList = $('#deviceListData').DataTable();
// Remove show entries
$('#deviceListData_length').remove();
// Log table
var logList = $('#logListData').DataTable();
// Remove show entries
$('#logListData_length').remove();
var openChart = $('#opn_clsd_stat').highcharts({
	chart: {
		plotBackgroundColor: null,
		plotBorderWidth: null,
		plotShadow: false,
		type: 'pie'
	},
	title: {
		text: 'Open and closed locks'
	},
	tooltip: {
		pointFormat: '{series.label}: <b>{point.percentage}</b>'
	},
	plotOptions: {
		pie: {
			allowPointSelect: true,
			cursor: 'pointer',
			dataLabels: {
				enabled: true
			},
			showInLegend: false
		}
	},
	series: [{
		name: 'Count',
		colorByPoint: true,
		data: []
	}]
});
