// ==UserScript==
// @name	虾米音乐助手
// @author	有一份田
// @description	虾米音乐助手带您突破虾米VIP会员音乐下载数量限制,畅享高品质音乐,另外通过分享VIP用户的Cookie,可以让普通用户也能享受到高品质音乐,这是一个合作分享的工具,人人喂我,我喂人人,世界因为分享更精彩
// @namespace	http://userscripts.org/scripts/show/175716
// @updateURL	https://userscripts.org/scripts/source/175716.meta.js
// @downloadURL	https://userscripts.org/scripts/source/175716.user.js
// @icon	http://img.duoluohua.com/appimg/script_xiamimusicscript_icon_48.png
// @license	GPL version 3
// @encoding	utf-8
// @include	http://www.xiami.com/download/*
// @grant       GM_xmlhttpRequest
// @run-at	document-end
// @version	1.0.5
// ==/UserScript==


/*
 * === 说明 ===
 *
 *@作者:有一份田
 *@官网:http://duoluohua.com/download/
 *@Email:youyifentian@gmail.com
 *@Git:http://git.oschina.net/youyifentian
 *@转载重用请保留此信息
 *@最后修改时间:2013.10.23
 *
 * === /说明 ===
 * */

var APPNAME='虾米音乐助手';
var VERSION='1.0.5';
var t=Math.random();
//该值决定了当检测到您不是虾米VIP会员时是否会向远程服务器请求数据,如果您是VIP会员请忽略;
var isRemote=true;

//该值为自定义远程服务器地址,输出格式需为json,
//如:{"status":1,"location":"加密的目标音乐url","sharename":"分享者名字","shareurl":"分享者主页"}
var remoteUrl='';

//该值为您自定义的虾米VIP会员Cookie,和会员uid,
//二者必须同时提供才有效且该Cookie必须为该uid的Cookie,
//如无效则会返回服务器上有效的VIP数据
//注意:服务器不会保存自定义Cookie,但是您可以根据脚本提供的链接主动分享您的有效VIP会员Cookie;
var locaCookie='';
var locaUid='';

var songsList=getSongList(),uid=getUid(),
    shareurl='http://www.duoluohua.com/myapp/api/xiami/share/?action=share',nowQuerySongUrl='',
    sharelisturl='http://www.duoluohua.com/myapp/api/xiami/share/?action=sharelist',
    locaQueryData='locacookie='+locaCookie+'&locauid='+locaUid,
    queryUrl='http://www.duoluohua.com/myapp/api/xiami/getsong/?action=geturl&fromid=xiamimusicscript&version='+VERSION,
    msgArr=[
	'您还 <font color="#FF55AA">不是</font> 虾米VIP会员,但您可以尝试修改脚本中 isRemote 的值来获取远程数据,以获取高品质音乐',
	'您是虾米VIP会员,您可以直接下载高品质音乐,您也可以 <a style="text-decoration:underline;" href="javascript:void(0);" onclick=\'window.open("'+shareurl+'");\' >点此</a> 分享您的Cookie----人人喂我,我喂人人<div><a style="text-decoration:underline;color:#999999;" href="javascript:void(0);" onclick=\'window.open("'+sharelisturl+'");\'>贡献者名单</a></div>',
	'您使用了自定义的VIP会员Cookie'+(remoteUrl.length ? "和自定义的远程服务器" : "")+',正在为您请求数据...',
	'您请求了远程VIP会员的数据,正在为您加载中...'
	];
(function(){
	if(!uid)return;
	var url='http://www.xiami.com/vip/update-tone?tone_type=1&user_id='+uid;
	showUerInfo();
	myAjax(url,function(opt){
		var type=opt.status;
		type=type==1 ? 1 : isRemote ? ((locaCookie && locaUid) ? 2 : 3) : 0;
		showUerInfo(msgArr[type]);
		getQueryUrl(type);
	});
})();

function getSongList(){
	var arr=[],objs=document.getElementsByClassName('song_info');
	for(var i=1;i<objs.length;i++){
		var tmpObj=objs[i].childNodes[1];
		var song=getSongInfo(tmpObj);
		if(song)arr.push(song);
	}
	return arr;
}
function getUid(){
	var o=document.getElementsByClassName('icon user')[0].parentNode;
	var reg=new RegExp('u\\/(\\w*)','ig');
	var arr=reg.exec(o.href);
	return arr[1] || '';
}
function getSongInfo(o){
	var reg=new RegExp('song\\/(\\w*)','ig');
	var arr=reg.exec(o.href);
	return {"o":o,"id":arr[1] || ""};
}

//1.如果是VIP会员则直接请求
//2.如果自定义了正确的远程信息,则访问远程服务器
//3.先访问作者服务器,由服务器给出最快的远程服务器地址,再开始请求

function getQueryUrl(type){
	var url='http://www.xiami.com/song/gethqsong/sid/';
	if(type<2){
		nowQuerySongUrl=url
	}else{
		if(remoteUrl.length){
			nowQuerySongUrl=buildUri(remoteUrl,locaQueryData);
		}else{
			GM_xmlhttpRequest({
				method: 'GET',
				url: queryUrl,
				onload: function(response) {
					var data=response.responseText,opt=JSON.parse(data);
					nowQuerySongUrl=url;
					if(opt.msg)showUerInfo(opt.msg);
					if(opt.status)nowQuerySongUrl=buildUri(opt.url,locaQueryData);
					goQuerySong();
				}
			});
		}
	}
	if(nowQuerySongUrl)goQuerySong();
}
function goQuerySong(){
	for(var i=0;i<songsList.length;i++){
		var song=songsList[i];
		querySong(song.o,song.id);
	}	
}
function querySong(o,id){
	var url=nowQuerySongUrl+id;
	
	showSongsInfo(o);
	myAjax(url,function(opt){
		opt.location=deStr(opt.location);
		showSongsInfo(o,opt);
	});
}
function showUerInfo(text){
	var o=document.getElementById('song_count').parentNode.parentNode,
	    html='<div align="center" style="color:#008000;"><b>'+(text || '用户数据赶来中...')+'</b></div>',
	    node=this.node;
	if(node){
		node.innerHTML=html;
		return;
	}
	node=document.createElement('span');
	updateNode=document.createElement('div');
	updateNode.innerHTML='<div align="center" ><a target="_blank" href="'+getUpdateUrl('getnewversion',1)+'"><img id="updateimg" style="display:none;"/></a></div>';
	node.innerHTML=html;
	o.appendChild(node);
	o.appendChild(updateNode);
	o.title=APPNAME;
	this.node=node;
	checkUpdate();
}
function showSongsInfo(o,opt){
	var node=o.node,url=opt ? opt.location : '';
	if(node){
		node.innerHTML='<a href="javascript:void(0);" onclick=\'window.open("'+url+'");\' style="float:right;position:relative;margin-right:30px;text-decoration:underline;">点此下载</a>';
		if(opt && opt.msg)showUerInfo(opt.msg);
		return;
	}
	var node=document.createElement('span');
	node.innerHTML='<span style="float:right;position:relative;margin-right:10px;color:#A1CBE4;">数据正在赶来中...</span>';
	o.parentNode.appendChild(node);
	o.node=node;	
}
function buildUri(url,strData){
	var arr_1=url.split('?'),arr_2=strData.split('&');
	var path=arr_1[0],tmp=arr_1[1] ? arr_1[1].split('&') : [];
	return path+'?'+tmp.concat(arr_2).join('&')+'&songid=';
}
function myAjax(url,callback){
	GM_xmlhttpRequest({
		method: 'GET',
		url: url,
		onload: function(response) {
			var data=response.responseText,opt=JSON.parse(data);
			callback(opt);
		}
	});
}
function checkUpdate(){
	var js='var info=document.getElementById("updateimg");';
	js+='info.src="'+getUpdateUrl('checkupdate',1)+'";';
	js+='info.onload=function(){';
	js+='info.style.display="block";';
	js+='}';
	loadJs(js);
}
function getUpdateUrl(action,type){
	return 'http://app.duoluohua.com/update?action='+action+'&system=script&appname=xiamimusicscript&apppot=scriptjs&frompot=songweb&type='+type+'&version='+VERSION+'&t='+t;
}
function loadJs(js){
	var oHead=document.getElementsByTagName('HEAD')[0],
	    oScript= document.createElement('script'); 
	oScript.type = 'text/javascript'; 
	oScript.text =js;
	oHead.appendChild( oScript); 	
}
function deStr(str){
	var _loc_10=undefined;
	var _loc_2=Number(str.charAt(0));
	var _loc_3=str.substring(1);
	var _loc_4=Math.floor(_loc_3.length / _loc_2);
	var _loc_5=_loc_3.length % _loc_2;
	var _loc_6=new Array();
	var _loc_7=0;
	while(_loc_7<_loc_5){
		if(_loc_6[_loc_7] == undefined){
			_loc_6[_loc_7]="";
		}
		_loc_6[_loc_7]=_loc_3.substr((_loc_4+1)*_loc_7,(_loc_4+1));
		_loc_7++;
	}
	while(_loc_7<_loc_2){
		_loc_6[_loc_7]=_loc_3.substr(_loc_4*(_loc_7-_loc_5)+(_loc_4+1)*_loc_5,_loc_4);
		_loc_7++;
	}
	var _loc_8='';
	_loc_7=0;
	while (_loc_7 < _loc_6[0].length){
		_loc_10 = 0;
                while (_loc_10 < _loc_6.length){
			_loc_8 = _loc_8 + _loc_6[_loc_10].charAt(_loc_7);
			_loc_10 = _loc_10 + 1;
		}
		_loc_7++;
	}
	_loc_8 = unescape(_loc_8);
	var _loc_9 = '';
	_loc_7 = 0;
	while (_loc_7 < _loc_8.length){
		if (_loc_8.charAt(_loc_7) == '^'){
                    _loc_9 = _loc_9 + '0';
                }else{
                    _loc_9 = _loc_9 + _loc_8.charAt(_loc_7);
                }
		_loc_7++;
	}
	_loc_9 = _loc_9.replace('+', ' ');
	return _loc_9;
}
function googleAnalytics(){
	var js="var _gaq = _gaq || [];";
	js+="_gaq.push(['_setAccount', 'UA-43280861-1']);";
	js+="_gaq.push(['_trackPageview']);";
	js+="function googleAnalytics(){";
	js+="	var ga = document.createElement('script');ga.type = 'text/javascript';";
	js+="	ga.async = true;ga.src = 'https://ssl.google-analytics.com/ga.js';";
	js+="	var s = document.getElementsByTagName('script')[0];";
	js+="	s.parentNode.insertBefore(ga, s)";
	js+="}";
	js+="googleAnalytics();";
	js+="_gaq.push(['_trackEvent','xiami_gm',String(new Date().getTime())]);";
	loadJs(js);
}
googleAnalytics();

