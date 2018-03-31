/*
*
*スクリプト概要 : 区間内の駅から1駅選択し、周辺情報を返すスクリプト
*使用API : 「路線 API/駅データ.jp」「Place API /Google Map」
*L147 に API KEY を入力する
*/

/*変数の宣言*/
var ROUTE = "山手線";
var ROUTECODE = "11302";//山手線の路線コード
var STATION_FROM = "品川";
var STATION_TO = "新宿";

//駅の整理番号格納用グローバル変数
var STATION_CD_FROM = "";
var STATION_CD_TO = "";


/*
*
*Main関数
*
*/

function myFunction(){
   var ENDPOINT = "http://www.ekidata.jp/api/l/"+ROUTECODE+".json";  

  //路線データの取得
  var station_list = getRailList(ENDPOINT); 
  
  //乗車駅と降車駅の駅番号をグローバル変数「STATION_CD_FROM」「STATION_CD_TO」に格納する(駅番号をもとに区間を絞り込み、通過駅のリストを作成するため)
  getStaionNumber(station_list);
  
  //乗車駅と降車駅の駅番号をもとに通過駅のリストを取得する
  var stops_list = getStopStation(station_list);

  //通過駅のリストから目的地の駅をランダムに1つ取得する
  var distination = setTargetStation(stops_list);
  
  //路線データから目的地の駅の経度と緯度を取得する
  var geo_info = getStationGeoInfo(station_list,distination);
  
  //目的地の駅の経度と緯度をもとに周辺情報の取得する
  var map_info = getMapInfo(geo_info.lat,geo_info.lon);
  
  //検索上位1位のみ取得
  var rank1 = map_info["results"][0];

  //確認用ログ出力
  Logger.log("路線 = "+ROUTE);
  Logger.log("区間A = "+STATION_FROM);
  Logger.log("区間B = "+STATION_TO);
  Logger.log("通過駅(順不同) = "+stops_list);
  Logger.log("周辺情報を取得する駅 = "+distination);
  Logger.log("検索結果= "+rank1["name"]);
  
}

/*
*
*路線データから周辺情報を検索する1駅を抽出するための関数群
*
*/

/*****「駅データ.jp」の「路線API」を使用し路線データを取得する*****/
function getRailList(ENDPOINT) {
  //余計な文字列を削除し、json形式で取得
  var res_string = UrlFetchApp.fetch(ENDPOINT).getContentText().slice(51,-57);
  var res_json = JSON.parse(res_string);
  
  //路線データから路線に含まれる駅名だけのリストを作成
  var station_list = res_json["station_l"];
  return station_list;
}

/*****乗車駅と降車駅の駅番号をグローバル変数「STATION_CD_FROM」「STATION_CD_TO」に格納 (通過駅のリスト作成に必要)*****/
function getStaionNumber(s_list){
  for(var i = 0; i < s_list.length; i++)
  {
    if(s_list[i]["station_name"] == STATION_FROM)
      STATION_CD_FROM = s_list[i]["station_cd"];
    else if (s_list[i]["station_name"] == STATION_TO)
      STATION_CD_TO = s_list[i]["station_cd"];
    else
      ;
  }
}

/*****取得した駅番号をもとに通過駅リストを作成*****/
function getStopStation(s_list){
  //環状線の場合は、駅番号の付け方により、逆回りを取得しないといけない可能性があるため処理を分ける。環状線以外は多分大丈夫)
  var loopline_flag= "TRUE";
  var st_list = [];
  
  //駅番号の振られ方で結果が変わらないよう順序をつける
  var station_cd_max = Math.max(STATION_CD_FROM, STATION_CD_TO);
  var station_cd_min = Math.min(STATION_CD_FROM, STATION_CD_TO);
  
  //通過駅リストを作成する(駅番号は路線内で連番なので、乗車駅の駅番号と降車駅の駅番号の間の駅番号をもつ駅を通過駅とみなす。
  for(var i = 0; i < s_list.length; i++)
  {
    //環状線は処理を変える(山手線の場合)
    if(loopline_flag == "TRUE"){
      if(!(station_cd_min < Number(s_list[i]["station_cd"]) && Number(s_list[i]["station_cd"] < station_cd_max)))
      st_list.push(s_list[i]["station_name"]);
    }
    else
    {
      
      if(station_cd_min <= Number(s_list[i]["station_cd"]) && Number(s_list[i]["station_cd"] <= station_cd_max))
      st_list.push(s_list[i]["station_name"]);
    }
  }
  return st_list;
}

/*****通過駅リストから周辺情報を取得する駅をランダムに1駅取得*****/
function setTargetStation(st_list){
  var random = Math.floor( Math.random() * st_list.length);
  return st_list[random];
}

/*****区間内にある駅から、指定された駅の位置情報を取得*****/
function getStationGeoInfo(s_list,dist){
  var g_info = [];
  for(var i = 0; i < s_list.length; i++)
  {
    if (s_list[i]["station_name"] == dist)
    {
      //経度と緯度を取得
      g_info["lat"] = s_list[i]["lat"];
      g_info["lon"] = s_list[i]["lon"];
    }
  }
  return g_info;
}

/*****
*
*周辺情報を取得する関数群
*
*****/

/**** マップ検索用のクエリオプションを設定 ****/
function getMapInfo(s_lat,s_lon) {
  var ENDPOINT = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?";
  var KEY = "";
  
  //取得した目的の駅の位置情報を設定
  var LOCATION = [s_lat,s_lon];
  
  var RADIUS = "3000"
  var TYPES = "hotel"
  var LANGUAGE = "ja"
  
  //検索クエリの作成
  var requestUrl = ENDPOINT + 'key=' + KEY + '&location=' + LOCATION + '&radius=' + RADIUS + '&keyword=' + TYPES + '&language=' + LANGUAGE;
  response = UrlFetchApp.fetch(requestUrl).getContentText("UTF-8");
  var map_info = JSON.parse(response);
  return map_info;
}
