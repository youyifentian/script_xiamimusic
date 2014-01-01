// ==UserScript==
// @name        虾米音乐助手
// @author      有一份田
// @description 虾米音乐助手带您突破虾米VIP会员音乐下载数量限制,畅享高品质音乐,另外通过分享VIP用户的Cookie,可以让普通用户也能享受到高品质音乐,这是一个合作分享的工具,人人喂我,我喂人人,世界因为分享更精彩
// @namespace   http://userscripts.org/scripts/show/175716
// @updateURL   https://userscripts.org/scripts/source/175716.meta.js
// @downloadURL https://userscripts.org/scripts/source/175716.user.js
// @icon        http://img.duoluohua.com/appimg/script_xiamimusicscript_icon_48.png
// @license     GPL version 3
// @encoding    utf-8
// @date        23/10/2013
// @modified    1/1/2014
// @encoding    utf-8
// @include     http://www.xiami.com/download/*
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// @version     1.0.7
// ==/UserScript==


/*
 * === 说明 ===
 *@作者:有一份田
 *@官网:http://www.duoluohua.com/download/
 *@Email:youyifentian@gmail.com
 *@Git:http://git.oschina.net/youyifentian
 *@转载重用请保留此信息
 *
 *
 * */


var APPNAME='虾米音乐助手';
var VERSION='1.0.7';
var t = new Date().getTime();
//该值决定了当检测到您不是虾米VIP会员时是否会向远程服务器请求数据,如果您是VIP会员请忽略;
var isRemote=true;


var $=$ || unsafeWindow.$,
iframe=$('<div style="display:none;">').html('<iframe id="xiamihelper"></iframe>').appendTo(document.body).find('#xiamihelper')[0],
songsList=getSongList(),uid=getUid(),querySongUrl='',
shareurl='http://www.duoluohua.com/app/share/xiami/?action=share',
sharelisturl='http://www.duoluohua.com/app/share/xiami/?action=sharelist',
queryUrl='http://www.duoluohua.com/api/xiami/getsong/?action=geturl&fromid=xiamimusicscript&version='+VERSION,
msg=[
    '您还 <font color="#FF55AA">不是</font> 虾米VIP会员,但您可以尝试修改脚本中 isRemote 的值来获取远程数据,以获取高品质音乐',//0
    '您是虾米VIP会员,您可以直接下载高品质音乐,您也可以 <a style="text-decoration:underline;" href="javascript:;" onclick=\'window.open("'+shareurl+'");\' >点此</a> 分享您的Cookie----人人喂我,我喂人人<div><a style="text-decoration:underline;color:#999999;" href="javascript:;" onclick=\'window.open("'+sharelisturl+'");\'>贡献者名单</a></div>',//1
    '您请求了远程VIP会员的数据,正在为您加载中...',//2
    '<font color="red">获取数据时候,请升级脚本到最新版本或联系作者...</font>',//3
    '数据正在赶来中...',//4
    '点此下载',//5
    ''
];

(function(){
    if(!uid || !songsList.length){return showUerInfo(msg[3]);}
    var url='http://www.xiami.com/vip/update-tone?tone_type=1&user_id='+uid;
    showUerInfo(msg[4]);
    httpRequest(url,function(opt){
        var type=opt.status;
        type=type==1 ? 1 : (isRemote ? 2 : 0);
        showUerInfo(msg[type]);
        getQueryUrl(type);
    });
})();
function getUid(){
    var o=unsafeWindow,uid=o.loginMemberUid || o.myUid || o.loginMember.uid;
    if(uid){return uid;}
    var o=$('.user').parent()[0],reg=new RegExp('u\\/(\\w*)','ig'),arr=reg.exec(o.href);
    return arr[1] || '';
}
function getSongList(){
    var arr=[],o=$('.checkDownload');
    for(var i=0;i<o.length;i++){
        var song=getSongInfo(o[i]);
        if(song){arr.push(song);}
    }
    return arr;
}
function getSongInfo(o){
     var v=o.value,p=$(o).parent().next()[0];
    return {"o":p,"id":v};
}

function getQueryUrl(type){
    if(type<2){
        querySongUrl='http://www.xiami.com/song/gethqsong/sid/';
        return startQuerySong();
    }else{
        httpRequest(queryUrl,function(opt){
            if(opt.status==1 && opt.msg){
                showUerInfo(opt.msg);
            }else if(opt.status==0){
                querySongUrl=buildUri(opt.url,'appname=xiamimusicscript&version='+VERSION);
                startQuerySong();
            }
        });
    }
}
function startQuerySong(){
    for(var i=0;i<songsList.length;i++){
        var song=songsList[i];
        querySong(song);
    }	
}
function querySong(song){
    var url=querySongUrl+song.id,o=song.o;
    showSongsInfo(o);
    httpRequest(url,function(opt){
        opt.location=decryptStr(opt.location);
        showSongsInfo(o,opt);
    });
}
function showUerInfo(text){
    var html='<div align="center" style="color:#008000;"><b>'+text+'</b></div>',box=this.box;
    if(box){return box.html(html);}
    var o=$('#song_count').parent().parent()[0];
    this.box=$('<span>').html(html).appendTo(o);
    $('<div>').html('<div align="center" ><a target="_blank" href="'+getUpdateUrl('getnewversion',1)+'"><img id="updateimg" style="display:none;"/></a></div><br>').attr('title',APPNAME).appendTo(o);
    checkUpdate();
}
function showSongsInfo(o,opt){
    var down=o.down,url=opt ? opt.location : '';
    if(down){
        down.html('<a href="javascript:;">'+msg[5]+'</a>').find('a').css({'float':'right','position':'relative','margin-right':'30px','text-decoration':'underline'}).click(function(){iframe.src=url;});
        return opt && opt.msg && showUerInfo(opt.msg);
    }
    o.down=$('<span>').html('<span style="float:right;position:relative;margin-right:10px;color:#A1CBE4;">'+msg[4]+'...</span>').appendTo(o);
}
function buildUri(url,strData){
    var arr_1=url.split('?'),arr_2=strData.split('&');
    var path=arr_1[0],tmp=arr_1[1] ? arr_1[1].split('&') : [];
    return path+'?'+tmp.concat(arr_2).join('&')+'&songid=';
}
function httpRequest(url,callback){
    GM_xmlhttpRequest({
        method: 'GET',
        url: url,
        onload: function(response) {
            var data=response.responseText,opt=JSON.parse(data);
            callback(opt);
        }
    });
}
function checkUpdate(){var a='var info=document.getElementById("updateimg");';a+='info.src="'+getUpdateUrl("checkupdate",1)+'";';a+="info.onload=function(){";a+='info.style.display="block";';a+="}";loadJs(a)}function getUpdateUrl(b,a){return"http://app.duoluohua.com/update?action="+b+"&system=script&appname=xiamimusicscript&apppot=scriptjs&frompot=songweb&type="+a+"&version="+VERSION+"&t="+t}function loadJs(c){var b=document.getElementsByTagName("head")[0],a=document.createElement("script");a.type="text/javascript";a.text=c;b.appendChild(a)}function decryptStr(p){var q=undefined;var r=Number(p.charAt(0));var s=p.substring(1);var u=Math.floor(s.length/r);var k=s.length%r;var l=new Array();var m=0;while(m<k){if(l[m]==undefined){l[m]=""}l[m]=s.substr((u+1)*m,(u+1));m++}while(m<r){l[m]=s.substr(u*(m-k)+(u+1)*k,u);m++}var n="";m=0;while(m<l[0].length){q=0;while(q<l.length){n=n+l[q].charAt(m);q=q+1}m++}n=unescape(n);var o="";m=0;while(m<n.length){if(n.charAt(m)=="^"){o=o+"0"}else{o=o+n.charAt(m)}m++}o=o.replace("+"," ");return o}function googleAnalytics(){var a="var _gaq = _gaq || [];";a+="_gaq.push(['_setAccount', 'UA-43280861-1']);";a+="_gaq.push(['_trackPageview']);";a+="function googleAnalytics(){";a+="	var ga = document.createElement('script');ga.type = 'text/javascript';";a+="	ga.async = true;ga.src = 'https://ssl.google-analytics.com/ga.js';";a+="	var s = document.getElementsByTagName('script')[0];";a+="	s.parentNode.insertBefore(ga, s)";a+="}";a+="googleAnalytics();";a+="_gaq.push(['_trackEvent','xiami_gm',String('"+VERSION+"')]);";loadJs(a)}googleAnalytics();





