/*
 Copyright (c) 2017 amano <amano@miku39.jp>

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */


var NicoLiveHelper = {
    version: "0.00",
    activeTab: '#tab-request',

    secofweek: 604800, // 1週間の秒数(60*60*24*7).
    remainpoint: 0,    // 所有ニコニコポイント

    nico_user_id: "",   // ニコニコのユーザーID
    is_premium: 0,
    connecttime: 0,     // 生放送への接続時刻（0は未接続）

    currentVideo: {},   // 現在再生中の動画情報

    liveProp: {},       // 新配信時の生放送パラメータ
    threadId: '',

    // 下コメに必要な情報
    postkey: '',
    ticket: '',
    _getpostkeyfunc: null,  // postkey取得後に実行する関数

    // 通常配信用 getplayerstatusの情報
    // TODO 新配信に移行するので削除予定
    liveinfo: {},      // LiveInfo
    userinfo: {},      // UserInfo
    serverinfo: {},    // ServerInfo
    twitterinfo: {},   // TwitterInfo
    iscaster: false,    // 生主フラグ
    post_token: "",     // 主コメ用のトークン

    /**
     * 放送に接続しているかを返す.
     * @return {boolean}
     */
    isConnected: function(){
        return !!this.connecttime;
    },

    isCaster: function(){
        try{
            // 公式放送だと isOperator が存在していない
            return !!this.liveProp.userStatus.isOperator;
        }catch( e ){
            return true;
        }
    },

    /**
     * 動画サムネイルを表示する.
     * @param event DOMイベント
     * @param video_id 動画ID
     */
    showThumbnail: function( event, video_id ){
        document.querySelector( '#iframe-thumbnail' ).src = "http://ext.nicovideo.jp/thumb/" + video_id;
        let x, y;
        // 312x176
        x = event.clientX;
        y = event.clientY;
        if( y + 176 > window.innerHeight ){
            y = y - 176 - 10;
        }
        if( x + 312 > window.innerWidth ){
            x = x - 312 - 10;
        }
        document.querySelector( '#iframe-thumbnail' ).style.left = x + 5 + "px";
        document.querySelector( '#iframe-thumbnail' ).style.top = y + 5 + "px";
        document.querySelector( '#iframe-thumbnail' ).style.display = 'block';
        document.querySelector( '#iframe-thumbnail' ).width = 312;
        document.querySelector( '#iframe-thumbnail' ).height = 176;
        document.querySelector( '#iframe-thumbnail' ).style.opacity = 1;
    },
    /**
     * 動画サムネイルを非表示にする.
     */
    hideThumbnail: function(){
        document.querySelector( '#iframe-thumbnail' ).width = 312;
        document.querySelector( '#iframe-thumbnail' ).height = 0;
        document.querySelector( '#iframe-thumbnail' ).style.opacity = 0;
    },

    /**
     * ウィンドウ下部にアラートメッセージを表示する.
     * @param text
     */
    showAlert: function( text ){
        $( '#my-alert-message' ).text( text );
        $( '#my-alert' ).show( 100 );

        clearTimeout( this._alert_timer );
        this._alert_timer = setTimeout( function(){
            $( '#my-alert' ).hide( 100 );
        }, 4000 );
    },

    calcElementHeight: function( view ){
        let positionY = $( window ).outerHeight() - this._statusbar_height;

        let rect = view.getBoundingClientRect();
        let y = rect.top + window.pageYOffset;

        let h = positionY - y;
        return parseInt( h );
    },

    /**
     * 特定の要素をフッターのところまで目一杯に広げるように高さを設定する.
     * @param tab
     */
    recalculateElementSize: function( tab ){
        /*
         * HTMLでXUL vboxのflex=1相当を縦方向にやる方法が分からないので
         * ウィンドウのリサイズ等があるたびに自力で計算して指定する.
         * 適当に display:flex; flex-direction:column指定してみてもうまく行かず.
         */
        if( !this._statusbar_height ){
            this._statusbar_height = $( '#footer' ).outerHeight();
        }

        let h, view;

        let req = () =>{
            view = $( '#request-view' )[0];
            h = this.calcElementHeight( view );
            view.style.height = h + 'px';
        };
        let stk = () =>{
            view = $( '#stock-view' )[0];
            h = this.calcElementHeight( view );
            view.style.height = h + 'px';
        };

        let his = () =>{
            let view1 = $( '#history-box-text' )[0];
            let view2 = $( '#history-view' )[0];

            if( view1.style.display == 'none' ){
                view = view2;
            }else{
                view = view1;
            }

            let h = this.calcElementHeight( view );
            view1.style.height = h + 'px';
            view2.style.height = h + 'px';
        };
        let cmt = () =>{
            view = $( '#comment-view' )[0];
            h = this.calcElementHeight( view );
            view.style.height = h + 'px';
        };

        let settings = () =>{
            view = $( '#settings' )[0];
            h = this.calcElementHeight( view );
            view.style.height = h + 'px';
        };


        switch( tab ){
        case '#tab-request':
            req();
            break;

        case '#tab-stock':
            stk();
            break;

        case '#tab-history':
            his();
            break;

        case '#tab-comment':
            cmt();
            break;

        default:
            break;
        }
    },


    /**
     * 動画情報のXMLをJavascriptオブジェクトにする.
     *
     * @param xml
     * @returns {Object}
     * @throw String エラーコードを例外として投げる
     */
    extractVideoInfo: function( xml ){
        // ニコニコ動画のgetthumbinfoのXMLから情報抽出.
        let info = {};

        let error = GetXmlText( xml, "/nicovideo_thumb_response/error/code" );
        if( error ){
            // COMMUNITY or NOT_FOUND or DELETED
            throw error;
        }

        let root;
        root = xml.getElementsByTagName( 'thumb' )[0];
        if( !root ) throw "no thumb tag";

        let tags = ["jp", "tw", "us"];
        let tagscnt = 0;
        for( let i = 0, elem; elem = root.childNodes[i]; i++ ){
            switch( elem.tagName ){
            case "user_id":
                info.user_id = elem.textContent;
                break;
            case "user_nickname":
                // 投稿者名
                info.user_nickname = elem.textContent;
                break;
            case "video_id":
                info.video_id = elem.textContent;
                break;
            case "title":
                info.title = restorehtmlspecialchars( elem.textContent );
                break;
            case "description":
                info.description = restorehtmlspecialchars( elem.textContent ).replace( /　/g, ' ' );
                info.description = info.description.replace( /<.*?>/g, "" );
                break;
            case "thumbnail_url":
                info.thumbnail_url = elem.textContent;
                break;
            case "first_retrieve":
                // Firefox 4からISO 8601フォーマットを読めるのでそのまま利用
                let d = new Date( elem.textContent );
                info.first_retrieve = d.getTime() / 1000; // seconds from epoc.
                break;
            case "length":
                // TODO getthumbinfoの情報と実際の再生時間が違う動画がある
                if( 0 && this._videolength["_" + info.video_id] ){
                    // getthumbinfo のデータと実際が合わない動画があるので調整データベースから
                    info.length = this._videolength["_" + info.video_id];
                }else{
                    info.length = elem.textContent;
                }
                let len = info.length.match( /\d+/g );
                info.length_ms = (parseInt( len[0], 10 ) * 60 + parseInt( len[1], 10 )) * 1000;
                break;
            case "view_counter":
                info.view_counter = parseInt( elem.textContent );
                break;
            case "comment_num":
                info.comment_num = parseInt( elem.textContent );
                break;
            case "mylist_counter":
                info.mylist_counter = parseInt( elem.textContent );
                break;
            case "tags":
                // attribute domain=jp のチェックが必要.
                // また、半角に正規化.
                let domain = elem.getAttribute( 'domain' ) || 'jp';
                let tag = elem.getElementsByTagName( 'tag' );
                if( !info.tags ){
                    info.tags = {};
                    info.tags_locked = {};
                }
                if( !info.tags[domain] ){
                    info.tags[domain] = [];
                    info.tags_locked[domain] = [];
                }
                else{
                    domain = 'tag' + tagscnt;
                    info.tags[domain] = [];
                    info.tags_locked[domain] = [];
                }
                if( !info.tags_array ) info.tags_array = [];
                for( let i = 0, item; item = tag[i]; i++ ){
                    let tag = restorehtmlspecialchars( ZenToHan( item.textContent ) );
                    info.tags[domain].push( tag );
                    info.tags_array.push( tag );

                    let tmp = item.getAttribute( 'lock' );
                    info.tags_locked[domain].push( !!tmp );
                }
                tagscnt++;
                break;
            case "size_high":
                info.filesize = parseInt( elem.textContent );
                info.highbitrate = elem.textContent;
                info.highbitrate = (info.highbitrate * 8 / (info.length_ms / 1000) / 1000).toFixed( 2 ); // kbps "string"
                break;
            case "size_low":
                info.lowbitrate = elem.textContent;
                info.lowbitrate = (info.lowbitrate * 8 / (info.length_ms / 1000) / 1000).toFixed( 2 ); // kbps "string"
                break;
            case "movie_type":
                info.movie_type = elem.textContent;
                break;
            case "no_live_play":
                info.no_live_play = parseInt( elem.textContent );
                break;
            default:
                break;
            }
        }
        // video_id がないときはエラーとしておこう、念のため.
        if( !info.video_id ){
            throw "no video id.";
        }

        // TODO P名取得
        // try{
        //     info.pname = this.getPName( info );
        // }catch( x ){
        //     info.pname = "";
        // }

        try{
            info.mylistcomment = NicoLiveMylist.mylist_itemdata["_" + info.video_id].description;
        }catch( x ){
            info.mylistcomment = "";
        }

        // TODO 機械学習による分類機能
        // if( Config.do_classify  ){
        //     let str = new Array();
        //     // 半角小文字で正規化してトレーニングをしているので、分類するときもそのように.
        //     for( k in info.tags ){
        //         for( let i = 0, tag; tag = info.tags[k][i]; i++ ){
        //             str.push( ZenToHan( tag.toLowerCase() ) );
        //         }
        //     }
        //     info.classify = NicoLiveClassifier.classify( str );
        // }

        return info;
    },


    /**
     * 動画情報を取得する.
     * @param video_id
     * @returns {Promise}
     */
    getVideoInfo: function( video_id ){
        let p1 = new Promise( ( resolve, reject ) =>{
            NicoApi.getthumbinfo( video_id, ( xml, req ) =>{
                try{
                    let vinfo = NicoLiveHelper.extractVideoInfo( xml );
                    vinfo.video_id = video_id;
                    resolve( vinfo );
                }
                catch( e ){
                    if( e === 'DELETED' ){
                    }
                    console.log( 'extract failed:' + e + ' ' + video_id );
                    reject( e );
                }
            } );
        } );
        return p1;
    },

    /**
     * 動画情報の表示用のエレメントを作成して返す.
     * @param vinfo
     * @returns {Node}
     */
    createVideoInfoElement: function( vinfo ){
        let t = document.querySelector( '#template-video-info' );
        let clone2 = document.importNode( t.content, true );
        let elem = clone2.firstElementChild;
        elem.setAttribute( 'nico_video_id', vinfo.video_id );

        let thumbnail_image = elem.querySelector( '.nico-thumbnail' );
        let bitrate = elem.querySelector( '.nico-bitrate' );
        let title = elem.querySelector( '.nico-title' );
        let video_prop = elem.querySelector( '.nico-video-prop' );
        let description = elem.querySelector( '.nico-description' );
        let tags = elem.querySelector( '.nico-tags' );
        let link = elem.querySelector( '.nico-link' );

        if( vinfo.no_live_play ){
            $( title ).addClass( 'no_live_play' );
        }
        if( vinfo.is_self_request ){
            $( elem ).addClass( 'self_request' );
            $( title ).addClass( 'self_request' );
        }

        link.setAttribute( "href", "http://www.nicovideo.jp/watch/" + vinfo.video_id );

        thumbnail_image.src = vinfo.thumbnail_url;
        thumbnail_image.addEventListener( 'mouseover', ( ev ) =>{
            NicoLiveHelper.showThumbnail( ev, vinfo.video_id );
        } );
        thumbnail_image.addEventListener( 'mouseout', ( ev ) =>{
            NicoLiveHelper.hideThumbnail();
        } );

        bitrate.textContent = vinfo.highbitrate.substring( 0, vinfo.highbitrate.length - 3 ) + 'k/' + vinfo.movie_type;
        title.textContent = vinfo.video_id + ' ' + vinfo.title;
        let tmp = GetDateString( vinfo.first_retrieve * 1000, true );
        video_prop.textContent = '投:' + tmp + ' 再:' + FormatCommas( vinfo.view_counter )
            + ' コ:' + FormatCommas( vinfo.comment_num ) + ' マ:' + FormatCommas( vinfo.mylist_counter ) + ' 時間:' + vinfo.length;

        //--- description
        // description.textContent = vinfo.description;
        {
            let div2 = document.createElement( 'div' );
            let str;
            str = vinfo.description.split( /(mylist\/\d+|sm\d+|nm\d+)/ );
            for( let i = 0; i < str.length; i++ ){
                let s = str[i];
                if( s.match( /mylist\/\d+/ ) ){
                    let a = document.createElement( 'a' );
                    let mylist = s;
                    a.setAttribute( "href", "http://www.nicovideo.jp/" + mylist );
                    a.setAttribute( "target", "_blank" );
                    a.setAttribute( "style", "text-decoration: underline;" );
                    a.appendChild( document.createTextNode( s ) );
                    div2.appendChild( a );
                }else if( s.match( /(sm|nm)\d+/ ) ){
                    let a = document.createElement( 'a' );
                    let vid = s;
                    a.setAttribute( "href", "http://www.nicovideo.jp/watch/" + vid );
                    a.setAttribute( "target", "_blank" );
                    a.setAttribute( "style", "text-decoration: underline;" );

                    a.addEventListener( 'mouseover', ( ev ) =>{
                        NicoLiveHelper.showThumbnail( ev, vid );
                    } );
                    a.addEventListener( 'mouseout', ( ev ) =>{
                        NicoLiveHelper.hideThumbnail();
                    } );
                    a.appendChild( document.createTextNode( s ) );
                    div2.appendChild( a );
                }else{
                    div2.appendChild( document.createTextNode( s ) );
                }
            }
            description.appendChild( div2 );
        }


        vinfo.tags['jp'].forEach( ( elem, idx, arr ) =>{
            let tag = document.createElement( 'span' );
            tag.setAttribute( 'class', 'badge badge-secondary' );
            tag.textContent = elem + ' ';

            if( vinfo.tags_locked['jp'][idx] ){
                let lockicon = document.createElement( 'span' );
                lockicon.setAttribute( 'class', 'glyphicon glyphicon-lock' );
                lockicon.setAttribute( 'aria-hidden', 'true' );
                tag.append( lockicon );
            }

            tags.appendChild( tag );

            tags.appendChild( document.createTextNode( ' ' ) );
        } );
        return clone2;
    },

    /**
     * リストに含まれている動画の合計時間を返す.
     * @param list
     * @returns {{min: (Number|*), sec: (number|*)}}
     */
    calcTotalVideoTime: function( list ){
        let t = 0;
        let s;

        for( let i = 0, item; item = list[i]; i++ ){
            s = item.length_ms;
            t += s;
        }
        t /= 1000;
        let min, sec;
        min = parseInt( t / 60 );
        sec = t % 60;
        if( sec < 10 ){
            sec = '0' + sec;
        }
        return {"min": min, "sec": sec};
    },

    /**
     * 配列をソートする.
     * @param queue ソートする配列
     * @param type ソート方法
     * @param order 昇順(1) or 降順(-1)
     */
    sortVideoList: function( queue, type, order ){
        // order:1だと昇順、order:-1だと降順.
        queue.sort( function( a, b ){
            let tmpa, tmpb;
            switch( type ){
            case 0:// 再生数.
                tmpa = a.view_counter;
                tmpb = b.view_counter;
                break;
            case 1:// コメ.
                tmpa = a.comment_num;
                tmpb = b.comment_num;
                break;
            case 2:// マイリス.
                tmpa = a.mylist_counter;
                tmpb = b.mylist_counter;
                break;
            case 3:// 時間.
                tmpa = a.length_ms;
                tmpb = b.length_ms;
                break;
            case 4:// 投稿日.
            default:
                tmpa = a.first_retrieve;
                tmpb = b.first_retrieve;
                break;
            case 5:// マイリス率.
                tmpa = a.mylist_counter / a.view_counter;
                tmpb = b.mylist_counter / b.view_counter;
                break;
            case 6:// タイトル.
                if( a.title < b.title ){
                    return -order;
                }else{
                    return order;
                }
                break;
            case 7:// マイリス登録日.
                tmpa = a.registerDate;
                tmpb = b.registerDate;
                break;
            case 8:// 宣伝ポイント.
                tmpa = a.uadp;
                tmpb = b.uadp;
                break;
            case 9:// ビットレート
                tmpa = a.highbitrate;
                tmpb = b.highbitrate;
                break;
            }
            return (tmpa - tmpb) * order;
        } );
    },

    /**
     * ステータスバーに表示する動画タイトルを指定する.
     * @param text
     */
    setStatusbarTitleText: function( text ){
        let st = $( '#statusbar-titletext' );
        st.text( text );

        let w = st.width();

        $( '#statusbar-progressbar' ).width( w );
    },

    /**
     * ステータスバーの現在再生中動画の経過時間(%)を設定する.
     * @param percent
     */
    setStatusbarProgress: function( percent ){
        $( '#statusbar-progressbar-gage' ).width( percent + "%" );
    },

    setStatusbarVideoRemain: function( text ){
        $( '#statusbar-video-remain' ).text( text );
    },


    /**
     * 文字列のマクロ展開を行う.
     * @param str 置換元も文字列
     * @param info 動画情報
     */
    replaceMacros: function( str, info ){
        // TODO 前からコピペしただけなので、マクロ展開を修正する
        let replacefunc = function( s, p ){
            let tmp = s;
            let expression;
            if( expression = p.match( /^=(.*)/ ) ){
                try{
                    tmp = eval( expression[1] );
                    if( tmp == undefined || tmp == null ) tmp = "";
                }catch( x ){
                    tmp = "";
                }
                return tmp;
            }
            switch( p ){
            case 'id':
                if( !info.video_id ) break;
                tmp = info.video_id;
                break;
            case 'title':
                if( !info.title ) break;
                tmp = info.title;
                break;
            case 'date':
                if( !info.first_retrieve ) break;
                tmp = GetDateString( info.first_retrieve * 1000 );
                break;
            case 'length':
                if( !info.length ) break;
                tmp = info.length;
                break;
            case 'view':
                if( !info.view_counter && 'number' != typeof info.view_counter ) break;
                tmp = FormatCommas( info.view_counter );
                break;
            case 'comment':
                if( !info.comment_num && 'number' != typeof info.comment_num ) break;
                tmp = FormatCommas( info.comment_num );
                break;
            case 'mylist':
                if( !info.mylist_counter && 'number' != typeof info.mylist_counter ) break;
                tmp = FormatCommas( info.mylist_counter );
                break;
            case 'mylistrate':
                if( !info.mylist_counter && 'number' != typeof info.mylist_counter ) break;
                if( !info.view_counter && 'number' != typeof info.view_counter ) break;
                if( info.view_counter == 0 ){
                    tmp = "0.0%";
                }else{
                    tmp = (100 * info.mylist_counter / info.view_counter).toFixed( 1 ) + "%";
                }
                break;
            case 'tags':
                // 1行40文字程度までかなぁ
                if( !info.tags['jp'] ) break;
                tmp = info.tags['jp'].join( '　' );
                // TODO 新配信ではタグが使えない
                tmp = tmp.replace( /(.{35,}?)　/g, "$1<br>" );
                break;
            case 'username':
                // 動画の投稿者名
                tmp = info.user_nickname || "";
                break;
            case 'pname':
                // P名
                break;
            case 'additional':
                // 動画DBに登録してある追加情報
                break;
            case 'description':
                // 詳細を40文字まで(世界の新着と同じ)
                tmp = info.description.match( /.{1,40}/ );
                break;

            case 'comment_no':
                // リク主のコメント番号
                tmp = info.comment_no || 0;
                break;

            case 'requestnum': // リク残数.
                tmp = NicoLiveRequest.requests.length;
                break;
            case 'requesttime': // リク残時間(mm:ss).
                let reqtime = NicoLiveRequest.getRequestTime();
                tmp = GetTimeString( reqtime.min * 60 + reqtime.sec );
                break;
            case 'stocknum':  // ストック残数.
                let remainstock = 0;
                NicoLiveStock.stock.forEach( function( item ){
                    if( !item.is_played ) remainstock++;
                } );
                tmp = remainstock;
                break;
            case 'stocktime': // ストック残時間(mm:ss).
                let stocktime = NicoLiveStock.getStockTime();
                tmp = GetTimeString( stocktime.min * 60 + stocktime.sec );
                break;

            case 'mylistcomment':
                // マイリストコメント
                tmp = info.mylistcomment;
                if( !tmp ) tmp = "";
                break;

            case 'pref:min-ago':
                // 枠終了 n 分前通知の設定値.
                tmp = Config.notice.time;
                break;

            case 'end-time':
                // 放送の終了時刻.
                tmp = GetDateString( NicoLiveHelper.liveProp.endTime * 1000 );
                break;

            case 'live-id':
                tmp = NicoLiveHelper.liveProp.relatedNicoliveProgramId;
                break;
            case 'live-title':
                tmp = NicoLiveHelper.liveProp.title;
                break;
            }
            return tmp;
        };
        // String.replace()だとネストが処理できないので自前で置換
        let r = "";
        let token = "";
        let nest = 0;
        for( let i = 0, ch; ch = str.charAt( i ); i++ ){
            switch( nest ){
            case 0:
                if( ch == '{' ){
                    nest++;
                    token += ch;
                    break;
                }
                r += ch;
                break;
            default:
                token += ch;
                if( ch == '{' ) nest++;
                if( ch == '}' ){
                    nest--;
                    if( nest <= 0 ){
                        try{
                            r += replacefunc( token, token.substring( 1, token.length - 1 ) );
                        }catch( x ){
                        }
                        token = "";
                    }
                }
                break;
            }
        }
        return r;
    },

    /**
     * 新配信で運営コメント送信をする.
     * @param text コメント
     * @param mail コマンド欄
     * @param name 名前
     * @param isPerm ずっと表示させる模様 "true" or "false" の文字列を渡す.
     */
    postCasterCommentNew: function( text, mail, name, isPerm ){
        if( text == '' ) return;

        let url = this.liveProp.operatorCommentApiUrl;
        let type = this.liveProp._type;

        // TODO 現状主コメは80文字までなのでマクロ展開する余地があるかどうか
        // text = this.replaceMacros( text, info );

        let xhr = CreateXHR( type == 'html5' ? 'PUT' : 'POST', url );
        xhr.onreadystatechange = () =>{
            if( xhr.readyState != 4 ) return;
            if( xhr.status != 200 ){
                console.log( `${xhr.status} ${xhr.responseText}` );
                let error = JSON.parse( xhr.responseText );
                this.showAlert( `コメント送信: ${error.meta.errorMessage || error.meta.errorCode}` );
                return;
            }
            console.log( `Comment posted: ${xhr.responseText}` );
        };

        if( type === 'html5' ){
            let form = new FormData();
            form.append( 'text', text );
            form.append( 'command', mail );
            form.append( 'name', name );
            form.append( 'isPermanent', isPerm );
            form.append( 'csrfToken', this.liveProp.csrfToken );
            xhr.send( form );
        }
        if( type === 'flash' ){
            let data = [];
            data.push( 'text=' + encodeURIComponent( text ) );
            data.push( 'command=' + encodeURIComponent( mail ) );
            data.push( 'name=' + encodeURIComponent( name ) );
            data.push( 'isPermanent=' + isPerm );
            data.push( 'csrfToken=' + encodeURIComponent( this.liveProp.csrfToken ) );
            data.push( '_method=PUT' );
            data.push( 'suppress_response_codes=true' );
            xhr.setRequestHeader( 'Content-type', 'application/x-www-form-urlencoded; charset=UTF-8' );
            xhr.send( data.join( "&" ) );
        }
    },

    /**
     * 運営コメントを行う（通常配信）.
     * @param comment 運営コメント
     * @param mail コマンド(hiddenや色など)
     * @param name 名前欄に表示する名前
     * @param type コメント種別(undefined or null:自動応答, 1:動画情報, 2:普通の主コメ
     * @param retry 送信エラーになったときのリトライ時にtrue
     */
    postCasterCommentLegacy: function( comment, mail, name, type, retry ){
        if( !this.iscaster ) return;
        if( comment.length <= 0 ) return;
        if( !mail ) mail = "";
        if( !name ) name = "";

        let f = function( xml, req ){
            if( req.readyState == 4 ){
                if( req.status == 200 ){
                    DebugLog( 'castercomment: ' + req.responseText );
                    // status=error&error=0
                    if( req.responseText.indexOf( "status=error" ) != -1 ){
                        if( !retry ){
                            setTimeout( function(){
                                NicoLiveHelper.postCasterCommentLegacy( comment, mail, name, type, true ); // retry=true
                            }, 3000 );
                        }else{
                            // 世界の新着、生放送引用拒否動画は、/playコマンドはエラーになる.
                            NicoLiveHelper.showAlert( "コメント送信に失敗しました:" + comment + "\n" );

                            let video_id;
                            try{
                                video_id = comment.match( /^\/play(sound)*\s+((sm|nm|so)\d+)/ )[1];
                            }catch( x ){
                                video_id = "";
                            }
                            if( video_id ){
                                // 再生に失敗しました
                                let str = Config.videoinfo.failed;
                                NicoLiveHelper.postCasterCommentLegacy( str, "" );
                                // TODO 再生失敗したら次の動画に行く
                                // if( NicoLiveHelper.autoplay && NicoLiveHelper._losstime ){
                                //     setTimeout( function(){
                                //         NicoLiveHelper.checkPlayNext();
                                //     }, 3000 );
                                // }
                            }
                        }
                    }else{
                        // 運営コメント送信に成功
                    }
                }else{
                    DebugLog( 'comment failed: status=' + req.status + "\n" );
                    setTimeout( function(){
                        NicoLiveHelper.postCasterCommentLegacy( comment, mail, name, type, true ); // retry=true
                    }, 2000 );
                }
            }
        };

        // TODO: 運営コメントのマクロ展開を追加する
        // let videoinfo = this.getCurrentVideoInfo();
        let truecomment = comment; //this.replaceMacros( comment, videoinfo );
        if( truecomment.length <= 0 ) return; // マクロ展開したあとにコメントが空なら何もしない

        // 主コメは184=falseにしても効果がないので常時trueに.
        let data = [];
        data.push( "body=" + encodeURIComponent( truecomment ) );
        data.push( "is184=true" );
        if( name ){
            data.push( "name=" + encodeURIComponent( name ) );
        }
        data.push( "token=" + NicoLiveHelper.post_token );
        // コマンドは mail=green%20shita と付ける.
        data.push( "mail=" + encodeURIComponent( mail ) );
        NicoApi.broadcast( this.liveinfo.request_id, data, f );
    },


    /**
     * コメントのXMLからJavascriptのオブジェクトに変換する.
     * @param xmlchat コメントのXML
     */
    extractCommentLegacy: function( xmlchat ){
        let chat = new Object();
        chat.text = restorehtmlspecialchars( xmlchat.textContent );
        chat.date = xmlchat.getAttribute( 'date' );
        chat.premium = xmlchat.getAttribute( 'premium' );
        chat.user_id = xmlchat.getAttribute( 'user_id' );
        chat.no = xmlchat.getAttribute( 'no' );
        chat.anonymity = xmlchat.getAttribute( 'anonymity' ) || "";
        chat.mail = xmlchat.getAttribute( 'mail' ) || "";
        chat.name = xmlchat.getAttribute( 'name' ) || "";
        chat.locale = xmlchat.getAttribute( 'locale' ) || "";
        chat.origin = xmlchat.getAttribute( 'origin' ) || "";
        chat.score = xmlchat.getAttribute( 'score' ) || 0; // スコアは負の数

        chat.date = chat.date && parseInt( chat.date ) || 0;
        chat.premium = chat.premium && parseInt( chat.premium ) || 0;
        chat.user_id = chat.user_id || "0";
        chat.anonymity = chat.anonymity && parseInt( chat.anonymity ) || 0;
        chat.no = chat.no && parseInt( chat.no ) || 0;
        chat.comment_no = chat.no;
        // 強・中・弱の閾値は、-1000 〜 -4800 〜 -10000 〜 負の最大数
        chat.score = chat.score && parseInt( chat.score ) || 0;

        if( chat.premium == 3 || chat.premium == 2 ){
            chat.text_notag = chat.text.replace( /<.*?>/g, "" );
        }else{
            chat.text_notag = chat.text;
        }

        this.last_res = chat.no;
        return chat;
    },

    /**
     * getplayerstatus APIのXMLをJavascriptオブジェクトに展開する.
     */
    extractPlayerStatusLegacy: function( xml ){
        let live_info = new LiveInfo();
        try{
            live_info.request_id = GetXmlText( xml, "/getplayerstatus/stream/id" );
            live_info.title = GetXmlText( xml, "/getplayerstatus/stream/title" );
            live_info.description = GetXmlText( xml, "/getplayerstatus/stream/description" );
            live_info.provider_type = GetXmlText( xml, "/getplayerstatus/stream/provider_type" );
            live_info.default_community = GetXmlText( xml, "/getplayerstatus/stream/default_community" );
            live_info.international = parseInt( GetXmlText( xml, "/getplayerstatus/stream/international" ) );
            live_info.is_owner = GetXmlText( xml, "/getplayerstatus/stream/is_owner" ) != '0';
            live_info.owner_id = GetXmlText( xml, "/getplayerstatus/stream/owner_id" );
            live_info.owner_name = GetXmlText( xml, "/getplayerstatus/stream/owner_name" );
            live_info.is_reserved = GetXmlText( xml, "/getplayerstatus/stream/is_reserved" ) != '0';

            live_info.base_time = parseInt( GetXmlText( xml, "/getplayerstatus/stream/base_time" ) );
            live_info.open_time = parseInt( GetXmlText( xml, "/getplayerstatus/stream/open_time" ) );
            live_info.start_time = parseInt( GetXmlText( xml, "/getplayerstatus/stream/start_time" ) );
            live_info.end_time = parseInt( GetXmlText( xml, "/getplayerstatus/stream/end_time" ) );

            live_info.twitter_tag = GetXmlText( xml, "/getplayerstatus/stream/twitter_tag" );
            live_info.nd_token = GetXmlText( xml, "/getplayerstatus/stream/nd_token" );
            live_info.broadcast_token = GetXmlText( xml, "/getplayerstatus/stream/broadcast_token" );
            live_info.is_priority_prefecture = GetXmlText( xml, "/getplayerstatus/stream/is_priority_prefecture" );

            live_info.picture_url = GetXmlText( xml, "/getplayerstatus/stream/picture_url" );
            live_info.thumb_url = GetXmlText( xml, "/getplayerstatus/stream/thumb_url" );
        }catch( x ){
            console.log( x );
        }

        let user_info = new UserInfo();
        try{
            user_info.user_id = GetXmlText( xml, "/getplayerstatus/user/user_id" );
            user_info.nickname = GetXmlText( xml, "/getplayerstatus/user/nickname" );
            user_info.is_premium = parseInt( GetXmlText( xml, "/getplayerstatus/user/is_premium" ) );
            user_info.userAge = GetXmlText( xml, "/getplayerstatus/user/userAge" );
            user_info.userSex = GetXmlText( xml, "/getplayerstatus/user/userSex" );
            user_info.userDomain = GetXmlText( xml, "/getplayerstatus/user/userDomain" ); // アクセス元の国
            user_info.userPrefecture = GetXmlText( xml, "/getplayerstatus/user/userPrefecture" );
            user_info.userLanguage = GetXmlText( xml, "/getplayerstatus/user/userLanguage" );
            user_info.room_label = GetXmlText( xml, "/getplayerstatus/user/room_label" );
            user_info.room_seetno = GetXmlText( xml, "/getplayerstatus/user/room_seetno" );
            user_info.is_join = GetXmlText( xml, "/getplayerstatus/user/is_join" ) != '0';
            user_info.twitter_info.status = GetXmlText( xml, "/getplayerstatus/user/twitter_info/status" );
            user_info.twitter_info.screen_name = GetXmlText( xml, "/getplayerstatus/user/twitter_info/screen_name" );
            user_info.twitter_info.followers_count = GetXmlText( xml, "/getplayerstatus/user/twitter_info/followers_count" );
            user_info.twitter_info.is_vip = GetXmlText( xml, "/getplayerstatus/user/twitter_info/is_vip" ) != '0';
            user_info.twitter_info.profile_image_url = GetXmlText( xml, "/getplayerstatus/user/twitter_info/profile_image_url" );
            user_info.twitter_info.after_auth = GetXmlText( xml, "/getplayerstatus/user/twitter_info/after_auth" );
            user_info.twitter_info.tweet_token = GetXmlText( xml, "/getplayerstatus/user/twitter_info/tweet_token" );
        }catch( x ){
            console.log( x );
        }

        let server_info = new ServerInfo();
        try{
            server_info.addr = GetXmlText( xml, "/getplayerstatus/ms/addr" );
            server_info.port = parseInt( GetXmlText( xml, "/getplayerstatus/ms/port" ) );
            server_info.thread = GetXmlText( xml, "/getplayerstatus/ms/thread" );
            // tidが1増えるたびに接続先ポートが1増える(アリーナ、立見席A,B,C)
            let tmp = EvaluateXPath( xml, "/getplayerstatus/tid_list/tid/text()" );
            for( let i = 0, item; item = tmp[i]; i++ ){
                server_info.tid.push( item.textContent );
            }
        }catch( x ){
            console.log( x );
        }

        let twitter_info = new TwitterInfo();
        try{
            twitter_info.live_enabled = GetXmlText( xml, "/getplayerstatus/twitter/live_enabled" ) != '0';
            twitter_info.vip_mode_count = parseInt( GetXmlText( xml, "/getplayerstatus/twitter/vip_mode_count" ) );
            twitter_info.live_api_url = GetXmlText( xml, "/getplayerstatus/twitter/live_api_url" );
        }catch( x ){
            console.log( x );
        }

        this.liveinfo = live_info;
        this.userinfo = user_info;
        this.serverinfo = server_info;
        this.twitterinfo = twitter_info;

        this.iscaster = live_info.is_owner;
        this.nico_user_id = user_info.user_id;
    },

    /**
     * コメントサーバー(アリーナ)接続前処理
     * @param request_id 放送ID
     */
    preprocessConnectServerLegacy: function( request_id ){
        let lines;
        try{
            // コメントのバックログ取得数
            lines = Config.comment.history_lines_on_connect * -1;
        }catch( x ){
            lines = -100;
        }

        if( !this.iscaster ){
            // リスナーの場合は getpublichstatus できないので、ここで終わり
            return;
        }

        // 生主の場合はgetpublishstatusをしてからコメントサーバーに接続する
        let f = function( xml, req ){
            if( req.readyState == 4 && req.status == 200 ){
                let xml = req.responseXML;
                NicoLiveHelper.post_token = xml.getElementsByTagName( 'token' )[0].textContent;
                NicoLiveHelper.liveinfo.start_time = parseInt( xml.getElementsByTagName( 'start_time' )[0].textContent );
                let tmp = parseInt( xml.getElementsByTagName( 'end_time' )[0].textContent );
                if( GetCurrentTime() <= tmp ){
                    // 取得した終了時刻がより現在より未来指していたら更新.
                    NicoLiveHelper.liveinfo.end_time = tmp;
                }else{
                    // ロスタイム突入
                }
                // exclude(排他)は放送開始しているかどうかのフラグ
                NicoLiveHelper._exclude = parseInt( xml.getElementsByTagName( 'exclude' )[0].textContent );
                DebugLog( 'exclude=' + NicoLiveHelper._exclude );
                DebugLog( 'token=' + NicoLiveHelper.post_token );
                DebugLog( 'starttime=' + NicoLiveHelper.liveinfo.start_time );
                DebugLog( 'endtime=' + NicoLiveHelper.liveinfo.end_time );

                // TODO コメントサーバーに接続する
                // tmp = NicoLiveHelper.connectCommentServer(
                //     NicoLiveHelper.serverinfo.addr,
                //     NicoLiveHelper.serverinfo.port,
                //     NicoLiveHelper.serverinfo.thread,
                //     dataListener,
                //     lines
                // );
                // NicoLiveHelper.connectioninfo[ARENA] = tmp;
                //
                // NicoLiveHelper.sendStartupComment();
                // if( Config.play_jingle ) NicoLiveHelper.playJingle();
            }
        };
        NicoApi.getpublishstatus( request_id, f );
    },


    /**
     * 視聴者コメントを処理する.
     */
    processListenersComment: function( chat ){
        let text = chat.text_notag;

        if( text.match( /((sm|nm)\d+)/ ) ){
            let video_id = RegExp.$1;
            let is_self_request = !!text.match( /[^他](貼|張)|自|関/ );
            let code = "";
            // TODO 作品コードの処理
            // code = chat.text.match( /(...[-+=/]....[-+=/].)/ )[1];
            // code = code.replace( /[-+=/]/g, "-" ); // JWID用作品コード.
            // NicoLiveHelper.product_code["_" + video_id] = code;
            NicoLiveRequest.addRequest( video_id, chat.comment_no, chat.user_id, is_self_request, code );
        }
        if( text.match( /(\d{10})/ ) ){
            let video_id = RegExp.$1;
            if( video_id == "8888888888" ) return;
            let is_self_request = !!text.match( /[^他](貼|張)|自|関/ );
            let code = "";
            NicoLiveRequest.addRequest( video_id, chat.comment_no, chat.user_id, is_self_request, code );
        }
    },

    /**
     * 受信したコメントを処理する.
     * @param chat
     */
    processComment: function( chat ){
        NicoLiveComment.addComment( chat );

        switch( chat.premium ){
        case 2: // チャンネル生放送の場合、こちらの場合もあり。/infoコマンドなどもココ
        case 3: // 運営コメント
            break;

        case 1: // プレミアム会員
        case 0: // 一般会員
            // リスナーコメント
            // 接続時より前のコメントは反応しない
            if( this.isCaster() && chat.date < this.connecttime ) return;
            this.processListenersComment( chat );

            if( Config.speech.do_speech ){
                if( chat.date > this.connecttime ){
                    NicoLiveTalker.webspeech2( chat.text_notag, Config.speech.speech_character_index );
                }
            }
            break;

        default:
            break;
        }
    },


    getpostkey: function( threadId ){
        let getpostkey = {
            "type": "watch",
            "body": {"params": [threadId], "command": "getpostkey"}
        };
        this._comm.send( JSON.stringify( getpostkey ) );
    },

    /**
     * 視聴者コメントをする.
     * @param mail
     * @param text
     */
    sendComment: function( mail, text ){
        this._getpostkeyfunc = () =>{
            this.sendComment( mail, text );
        };

        if( Config.comment.comment184 ){
            mail += " 184";
        }

        // TODO openTimeがHTML5用なのでFlash対応する
        let vpos = Math.floor( (GetCurrentTime() - this.liveProp.openTime / 1000 ) * 100 );
        let chat = {
            "chat": {
                "thread": this.threadId,
                "vpos": vpos,
                "mail": mail,
                "ticket": this.ticket,
                "user_id": this.nico_user_id,
                "premium": this.is_premium,
                "postkey": this.postkey,
                "content": text
            }
        };
        this._comment_svr.send( JSON.stringify( chat ) );
        console.log( chat );
    },

    /**
     * コメントサーバーからコメントデータを受け取ったときの処理.
     * @param data
     */
    onCommentReceived: function( data ){
        // console.log( data );    // TODO コメント受信したときのログ表示
        if( data.thread ){
            // data.thread.ticket;
            // data.thread.last_res;
            // data.thread.resultcode;
            this.ticket = data.thread.ticket;
            console.log( `ticket:${this.ticket}` );
        }

        if( data.chat_result ){
            let result = data.chat_result;
            switch( result.status ){
            case 4:
                // コメントするには postkey の再取得が必要
                this.getpostkey( this.threadId );
                break;

            case 1:
                this.showAlert( `コメントの連投規制中です` );
                break;
            case 8:
                this.showAlert( `コメントが長すぎます` );
                break;

            default:
                break;
            }
        }

        if( data.chat ){
            let chat = data.chat;
            // 念のために従来のように値がなかった時のため
            chat.mail = chat.mail || "";
            chat.name = chat.name || "";
            chat.locale = chat.locale || "";
            chat.score = chat.score || 0;   // スコアは負の数
            chat.date = chat.date || 0;     // UNIX時間
            chat.premium = chat.premium || 0;
            chat.user_id = chat.user_id || "0";
            chat.anonymity = chat.anonymity || 0;
            chat.no = chat.no || 0;
            chat.comment_no = chat.no;
            chat.text = chat.content;

            chat.yourpost = chat.yourpost || 0; // 自分のコメントかどうかの1 or 0
            if( chat.user_id == this.nico_user_id ){
                // yourpostは過去ログには適用されないので自身で判断
                // ただし184だと識別できないのでユーザーIDが一致するときだけ。
                chat.yourpost = 1;
            }

            if( chat.premium == 3 || chat.premium == 2 ){
                // 主コメ
                chat.text_notag = chat.text.replace( /<.*?>/g, "" );
            }else{
                chat.text_notag = chat.text;
            }

            this.processComment( chat );
        }
    },

    /**
     * WebSocketでコメントサーバーに接続する.
     * @param room
     */
    connectCommentServerWS: function( room ){
        console.log( 'connect comment server(websocket)...' );
        console.log( `websocket uri: ${room.messageServerUri}` );
        console.log( `thread id: ${room.threadId}` );
        console.log( `room name: ${room.roomName}` );
        console.log( `server type: ${room.messageServerType}` );

        this.threadId = room.threadId;

        // sub-protocol "msg.nicovideo.jp#json"
        this._comment_svr = new Comm( room.messageServerUri, "msg.nicovideo.jp#json" );
        this._comment_svr.connect();
        this._comment_svr.onConnect( ( ev ) =>{
            console.log( 'comment server connected.' );
            this.connecttime = GetCurrentTime();

            let lines = Config.comment.history_lines_on_connect * -1;
            let str = {
                "thread": {
                    "thread": "" + room.threadId,
                    "version": "20061206",
                    "fork": 0,
                    "user_id": this.nico_user_id,
                    "res_from": lines,
                    "with_global": 1,
                    "scores": 1,
                    "nicoru": 0,
                    "userkey": ""
                }
            };
            this._comment_svr.send( JSON.stringify( str ) );
            this.showAlert( `コメントサーバーに接続しました` );

            let hist;
            hist = this.liveProp.title + " " + this.liveProp.relatedNicoliveProgramId + " (" + GetDateString( this.liveProp.beginTime, true ) + "-)\n";
            NicoLiveHistory.addHistoryText( hist );
        } );
        this._comment_svr.onReceive( ( ev ) =>{
            let data = JSON.parse( ev.data );
            this.onCommentReceived( data );
        } );
    },

    onWatchCommandReceived: function( data ){
        // console.log( data ); // TODO 受信時のログ表示
        let body = data.body;
        switch( data.type ){
        case 'watch':
            switch( body.command ){
            case 'userstatus':
                // HTML5ならthis.liveProp.userStatusにも格納されている
                this.nico_user_id = body.params[0];
                // プレミアム会員フラグ
                this.is_premium = body.params[1].match( /true/i ) ? 1 : 0;
                // 公式放送だと isCommentable フラグで受け取るコメント内容が違う
                // 実際、HTML5版とFlash版プレイヤーで内容が違う
                let getpermit = {
                    "type": "watch",
                    "body": {
                        "command": "getpermit",
                        "requirement": {
                            "broadcastId": this.liveProp.broadcastId,
                            "route": "",
                            // "stream": {"protocol": "hls", "requireNewStream": true, "priorStreamQuality": "high"},
                            "room": {"isCommentable": true, "protocol": "webSocket"}
                        }
                    }
                };
                this._comm.send( JSON.stringify( getpermit ) );
                break;
            case 'servertime':
                // サーバー時刻
                // let svrtime = new Date( parseInt( body.params[0] ) );
                // DebugLog( `svr time: ${svrtime}` );
                break;
            case 'permit':
                // 不明
                break;
            case 'currentstream':
                // ライブ動画配信のアドレス
                break;
            case 'currentroom':
                // コメントサーバー
                this.connectCommentServerWS( body.room );
                this.getpostkey( body.room.threadId );
                break;
            case 'statistics':
                // body.params[0]; // 来場者数
                // body.params[1]; // コメント数
                // body.params[2]; // 不明
                // body.params[3]; // 不明
                console.log( `Now ${body.params[0]} listeners. ${body.params[1]} comments.` );
                $( '#number-of-listeners' ).text( FormatCommas( body.params[0] ) );
                break;
            case 'watchinginterval':
                // body.params[0]; // 何かの間隔秒数
                break;
            case 'schedule':
                // 放送時間の更新か？
                // body.update.begintime;
                // body.update.endtime;
                console.log( `begin time:${body.update.begintime}, end time:${body.update.endtime}` );
                break;
            case 'postkey':
                this.postkey = body.params[0];
                // body.params[0]; // postkey
                // body.params[1]; // null
                // body.params[2]; // 何かの数字postkeyに含まれるものと同じ
                console.log( `postkey:${this.postkey}` );

                if( "function" === typeof this._getpostkeyfunc ){
                    this._getpostkeyfunc();
                    this._getpostkeyfunc = null;
                }
                break;
            }

            break;
        case 'ping':
            this._comm.send( JSON.stringify( {"type": "pong", "body": {}} ) );
            break;
        }
    },

    connectWebSocket: function(){
        // TODO WebSocketまわりのコードを整理する
        let ws = this.liveProp.webSocketUrl;    // HTML5プレイヤー用
        if( this.liveProp._type=='flash'){
            ws = this.liveProp.webSocketUrl + this.liveProp.broadcastId +
                "?audience_token=" + this.liveProp.audienceToken; // Flash用
        }

        this._comm = new Comm( ws );
        this._comm.connect();
        this._comm.onConnect( ( ev ) =>{
            console.log( `websocket connected. ${this.liveProp.broadcastId}` );
            setTimeout( () =>{
                let getuserstatus = {"type": "watch", "body": {"params": [], "command": "getuserstatus"}};
                this._comm.send( JSON.stringify( getuserstatus ) );
            }, 100 );
        } );
        this._comm.onReceive( ( ev ) =>{
            let data = JSON.parse( ev.data );
            this.onWatchCommandReceived( data );
        } );
    },

    /**
     * 生放送に接続する.
     * @param request_id 放送ID
     * @param title 番組のタイトル(事前に分かっていれば)
     * @param iscaster 生主かどうか（同上)
     * @param community_id 放送しているコミュニティID
     */
    openNewBroadcast: function( request_id, title, iscaster, community_id ){
        if( !request_id ){
            return;
        }
        // 新配信用 liveProp に生放送情報が設定されているのが前提
        if( this.liveProp ){
            this.connectWebSocket();
        }

        // 通常配信用
        let f = function( xml, req ){
            if( req.readyState != 4 ) return;
            if( req.status != 200 ){
                DebugLog( "getplayerstatusに失敗しました。再度、接続してください。\n" );
                return;
            }

            let status = EvaluateXPath( xml, "/getplayerstatus/@status" )[0].value;
            if( status == 'fail' ){
                alert( "番組情報を取得できませんでした. CODE=" + xml.getElementsByTagName( 'code' )[0].textContent );
                return;
            }
            NicoLiveHelper.extractPlayerStatusLegacy( xml );

            // 現在再生している動画を調べる.
            let contents = xml.getElementsByTagName( 'contents' );
            let noprepare = 0;
            for( let i = 0, currentplay; currentplay = contents[i]; i++ ){
                let id = currentplay.getAttribute( 'id' );
                let title = currentplay.getAttribute( 'title' ) || "";
                // 2回必要
                title = restorehtmlspecialchars( title );
                title = restorehtmlspecialchars( title );
                let soundonly = currentplay.getAttribute( 'disableVideo' ) == '1' ? true : false;
                if( id === "main" ){
                    NicoLiveHelper.setStatusbarTitleText( title );
                    let st = currentplay.getAttribute( 'start_time' ); // 再生開始時刻.
                    let du = currentplay.getAttribute( 'duration' );   // 動画の長さ.
                    st = st && parseInt( st ) || 0;
                    du = du && parseInt( du ) || 0;
                    // 現在再生中の動画を認識する
                    if( du ){
                        // 動画の長さが設定されているときは何か再生中.
                        // 再生中の動画情報をセット.
                        let tmp = currentplay.textContent.match( /(sm|nm|ze|so)\d+|\d{10}/ );
                        if( tmp ){
                            let video_id = tmp[0];
                            NicoLiveHelper.currentVideo.play_begin = st;
                            NicoLiveHelper.currentVideo.play_end = st + du + 1;
                            NicoLiveHelper.getVideoInfo( video_id )
                                .then( ( result ) =>{
                                    NicoLiveHelper.currentVideo.info = result;
                                    NicoLiveHistory.addHistory( result );

                                    // TODO 表示テストで複数作っているのであとで削除する
                                    NicoLiveHistory.addHistory( result );
                                    NicoLiveHistory.addHistory( result );
                                    NicoLiveHistory.addHistory( result );
                                    NicoLiveHistory.addHistory( result );
                                    NicoLiveHistory.addHistory( result );
                                } )
                                .catch( ( reason ) =>{
                                    console.log( reason );
                                    console.log( `not found ${video_id}` );
                                } );
                        }

                        if( NicoLiveHelper.iscaster ){
                            // TODO 生主なら次曲再生できるようにセット.
                            // let remain;
                            // remain = (st + du) - GetCurrentTime(); // second.
                            // remain = remain + 1; // 1秒ほどゲタ履かせておく
                            // NicoLiveHelper.setupPlayNext( target, remain, noprepare );
                            // noprepare++; // 先読みするのは一つだけにしておく
                        }
                    }
                }
                if( id === "sub" ){
                }
            }

            let serverdate = EvaluateXPath( xml, "/getplayerstatus/@time" );
            if( serverdate.length ){
                serverdate = serverdate[0].value;
            }else{
                serverdate = GetCurrentTime();
            }
            serverdate = new Date( serverdate * 1000 );
            NicoLiveHelper.connecttime = serverdate.getTime() / 1000;
            DebugLog( "接続時刻: " + GetDateString( NicoLiveHelper.connecttime * 1000 ) + "\n" );

            if( title ){
                NicoLiveHelper.liveinfo.title = title;
            }

            if( !NicoLiveHelper.iscaster ){
                // リスナーはコメント60文字(公式)に合わせる
                $( '#txt-input-comment' ).attr( 'maxlength', '60' );
            }

            document.title = NicoLiveHelper.liveinfo.request_id + " " + NicoLiveHelper.liveinfo.title + " (" + NicoLiveHelper.liveinfo.owner_name + ") - NicoLive Helper X";

            if( EvaluateXPath( xml, "//quesheet" ).length ){
                // タイムシフトの場合プレイリストを再構築.
                DebugLog( "この放送はタイムシフトです。\n" );
                // NicoLiveHelper.construct_playlist_for_timeshift( xml );
            }

            $( '#icon-thumbnail' ).attr( 'src', NicoLiveHelper.liveinfo.thumb_url );

            NicoLiveHelper.preprocessConnectServerLegacy( NicoLiveHelper.liveinfo.request_id );
            NicoLiveHelper.initTimers();
        };

        // initVars()でタイマーIDを保存しているワークを初期化するので
        // 先に止める
        // this.stopTimers();
        // this._donotshowdisconnectalert = true;
        // this.closeAllConnection();
        //
        // NicoLiveComment.clearAll();
        //
        // this.initVars();
        NicoApi.getplayerstatus( request_id, f );
    },

    /**
     * ハートビートを実施する.
     * 1分ごとに呼ばれて、来場者数を更新する。
     */
    heartbeat: function(){
        if( !this.isConnected() ) return;
        let f = function( xml, req ){
            if( req.readyState == 4 && req.status == 200 ){
                let xml = req.responseXML;
                try{
                    let watcher = xml.getElementsByTagName( 'watchCount' )[0].textContent;

                    $( '#number-of-listeners' ).text( FormatCommas( watcher ) );
                }catch( x ){
                }
            }
        };
        let data = [];
        data.push( "v=" + this.liveinfo.request_id );
        NicoApi.heartbeat( data, f );
    },

    getLiveProp: function( lvid ){
        // クロスオリジンの問題でできない
        let url = `http://live2.nicovideo.jp/watch/${lvid}`;
        let iframe = document.createElement( 'iframe' );
        iframe.setAttribute( 'src', url );
        iframe.setAttribute( 'id', 'getliveprop' );

        $( iframe ).on( 'load', ( ev ) =>{
            console.log( ev );
        } );

    },

    /**
     * 放送IDを入力して、生放送に接続する.
     */
    connectLive: function(){
        let lvid = window.prompt( "放送IDまたは放送のURLを入力してください", "" );
        if( lvid ){
            // TODO 新配信だとページ内にある生放送情報が必要なので、その取得方法どうするか考える
            let request_id = lvid.match( /lv\d+/ );
            if( request_id ){
                this.openNewBroadcast( request_id, "", true, "" );
            }
            /*
            request_id = lvid.match( /co\d+/ ) || lvid.match( /ch\d+/ );
            if( request_id ){
                this.openNewBroadcast( request_id, "", true, request_id );
            }
            */
        }
    },

    initTimers: function(){
        clearInterval( this._update_timer );
        this._update_timer = setInterval( () =>{
            this.update();
        }, 1000 );
    },

    /**
     * 毎秒呼び出される関数.
     */
    update: function(){
        let now = GetCurrentTime();
        let p = now - this.liveinfo.start_time;  // Progress
        let remaintime = this.liveinfo.end_time - now;
        let n = Math.floor( p / (30 * 60) ); // 30分単位に0,1,2,...

        let liveprogress = now - this.liveinfo.start_time;
        let liveremain = this.liveinfo.end_time - now;
        $( '#live-progress' ).text( GetTimeString( liveprogress ) );

        if( this.currentVideo.info ){
            // 現在再生中動画の進行状態を更新
            let begin_time = this.currentVideo.play_begin;
            let videolength = this.currentVideo.info.length_ms / 1000;
            let videoprogress = now - begin_time;

            this.setStatusbarProgress( parseInt( videoprogress / videolength * 100 ) );

            let videoremain = videolength - videoprogress;
            if( videoremain < 0 ) videoremain = 0;
            let str;
            this._flg_displayprogresstime = this._flg_displayprogresstime || 0;
            switch( this._flg_displayprogresstime ){
            case 0:
                str = '(' + '-' + GetTimeString( videoremain ) + '/' + this.currentVideo.info.length + ')';
                break;
            case 1:
                str = '(' + GetTimeString( videoprogress ) + '/' + this.currentVideo.info.length + ')';
                break;
            case 2:
                let remain = this.liveinfo.end_time - this.currentVideo.play_end; // 枠の残り時間.
                str = ' [枠残 ' + GetTimeString( remain ) + ']';
                break;
            }

            // this.setStatusbarTitleText( '《CeVIO:さとうささら》Rainbow Colors《Music Video》' );
            this.setStatusbarVideoRemain( str );
        }

        // TODO 残り時間の通知
        // let nt = Config.notice.time;
        // if( (this.liveinfo.end_time && remaintime > 0 && remaintime < nt * 60) ||
        //     (!this.liveinfo.end_time && n >= 0 && p > (30 - nt) * 60 + 30 * 60 * n) ){
        //     // 終了時刻が分かっているのであれば終了時刻から残り3分未満を見る.
        //     // 分からないときは 27分+30分*n(n=0,1,2,...)越えたら.
        //     if( !this._isnotified[n] ){
        //         this.showNoticeLeft();
        //         this._isnotified[n] = true;
        //     }
        // }
    },

    initAutoComplete: function(){
        let autocomplete_elem = $( '#comment-autocomplete' );
        autocomplete_elem.empty();

        let autocomplete = Config.comment.autocomplete.split( /\n|\r|\r\n/ );
        for( let i = 0, item; item = autocomplete[i]; i++ ){
            let elem = document.createElement( 'option' );
            $( elem ).text( item );
            autocomplete_elem.append( elem );
        }
    },

    /**
     * UIの初期化を行う.
     */
    initUI: function(){
        console.log( `open ${Config.active_tab}` );
        $( Config.active_tab ).tab( 'show' );

        // アクティブタブを設定
        $( `a[data-toggle="tab"][href="${Config.active_tab}"]` ).addClass( 'active' );

        // タブが切り替わったときの処理
        $( 'a[data-toggle="tab"]' ).on( 'shown.bs.tab', function( e ){
            let target = $( e.target ).attr( "href" );
            Config.active_tab = target;
            NicoLiveHelper.recalculateElementSize( target );
            SaveConfig();
        } );

        // リクエスト可否チェックボックス
        $( '#request-enabled' ).prop( 'checked', Config.request.enabled );
        $( '#request-enabled' ).on( 'change', ( ev ) =>{
            Config.request.enabled = !!$( '#request-enabled' ).prop( 'checked' );
            SaveConfig();
        } );

        $( '#select-play-style' ).val( Config.play_style );
        $( "#select-play-style" ).change( function(){
            Config.play_style = $( '#select-play-style' ).val();
            SaveConfig();
        } );

        // 生放送に接続する（通常配信用）
        $( '#connect-live' ).on( 'click', ( ev ) =>{
            this.connectLive();
        } );

        $( '#save-comment' ).on( 'click', ( ev ) =>{
            NicoLiveComment.saveFile();
        } );
        $( '#mylist-manager' ).on( 'click', ( ev ) =>{
            window.open( 'mylistmanager/mylistmanager.html', 'nicolivehelperx_mylistmanager',
                'width=640,height=480,menubar=no,toolbar=no,location=no' );
        } );

        $( '#open-settings' ).on( 'click', ( ev ) =>{
            window.open( "options.html", "nicolivehelperx_options", "width=640,height=480,menubar=no,toolbar=no,location=no" );
        } );
        // 再生履歴の表示タイプ切り替え
        $( '#select-history-view' ).on( 'change', ( ev ) =>{
            let n = parseInt( ev.target.value );
            let tmp = [$( '#history-box-text' ), $( '#history-view' )];
            tmp[n].show();
            tmp[1 - n].hide();
            this.recalculateElementSize( this.activeTab );
        } );


        $( '#aboutModalTitle' ).text( 'NicoLive Helper X version ' + NicoLiveHelper.version );
        this.recalculateElementSize( Config.active_tab );
    },

    /**
     * 設定に合わせて画面を更新する.
     */
    configUpdated: function(){
        this.initAutoComplete();
        NicoLiveRequest.loadNGVideosSetting();

        // 動画詳細表示の有無。スタイルを直接変更する。
        let style;
        for( let i = 0, item; item = document.styleSheets[i]; i++ ){
            if( item.href.match( /main\.css/ ) ){
                style = item;
                break;
            }
        }
        let n = style.cssRules.length;
        for( let i = 0; i < n; i++ ){
            let css = style.cssRules[i];
            if( css.selectorText == ".nico-description" ){
                if( Config.show_description ){
                    css.style.display = "block";
                }else{
                    css.style.display = "none";
                }
            }
        }
    },

    init: function(){
        console.log( 'initialize nicolivehelper' );
        this.initUI();

        let lvid = GetParameterByName( 'lv' );
        if( lvid ){
            console.log( 'get liveinfo' );
            browser.runtime.sendMessage( {
                cmd: 'get-liveinfo',
                request_id: lvid
            } ).then( ( success ) =>{
                this.liveProp = success;
                this.openNewBroadcast( lvid );
            }, ( failed ) =>{
                console.log( failed );
            } );
        }

        this.configUpdated();

        // 設定画面で変更されたConfigの更新
        browser.storage.onChanged.addListener( ( changes, area ) =>{
            console.log( area );
            console.log( changes );
            if( area == 'sync' ){
                if( changes['config'] ){
                    Config = changes.config.newValue;
                    console.log( 'update config' );
                    this.configUpdated();
                }
            }
        } );
    },

    destroy: function(){
        if( this._comment_svr ){
            this._comment_svr.close();
        }
        if( this._comm ){
            this._comm.close();
        }
    }
};


window.addEventListener( 'load', ( ev ) =>{
    DebugLog( 'NicoLive Helper X ' + NicoLiveHelper.version + "\n" );

    let initf = () =>{
        Tweet.init();
        NicoLiveHelper.init();
        NicoLiveMylist.init();
        NicoLiveRequest.init();
        NicoLiveStock.init();
        NicoLiveComment.init();
        NicoLiveTalker.init();
        NicoLiveHistory.init();
    };

    browser.storage.sync.get( 'config' ).then(
        ( result ) =>{
            console.log( 'config loaded' );
            console.log( result );

            Config = MergeSimpleObject( Config, result.config );
            Config.loaded = true;

            initf();
        },
        ( error ) =>{
            console.log( error );
            Config.loaded = true;
            initf();
        } );
} );

window.addEventListener( 'unload', ( ev ) =>{
    console.log( 'window unloaded.' );
} );

window.addEventListener( "beforeunload", ( ev ) =>{
    console.log( 'config saving.' );
    SaveConfig();
    NicoLiveHelper.destroy();
} );

window.addEventListener( 'resize', ( ev ) =>{
    NicoLiveHelper.recalculateElementSize( Config.active_tab );
} );


browser.management.getSelf().then( ( info ) =>{
    console.log( 'NicoLive Helper X ' + info.version );
    NicoLiveHelper.version = info.version;
} );


let lvid = GetParameterByName( 'lv' );
console.log( 'lvid=' + lvid );

if( lvid ){
    console.log( 'get liveinfo' );
    browser.runtime.sendMessage( {
        cmd: 'get-liveinfo',
        request_id: lvid
    } ).then( ( success ) =>{
        NicoLiveHelper.liveProp = success;
    }, ( failed ) =>{
        console.log( failed );
    } );
}


// ストックタブ以外ではドロップしてページ遷移とかしないように禁止する.
let cancelEvent = ( ev ) =>{
    ev.preventDefault();
    ev.stopPropagation();
    return false;
};
$( window ).on( 'dragenter', ( ev ) =>{
    return cancelEvent( ev );
} );
$( window ).on( 'dragover', ( ev ) =>{
    return cancelEvent( ev );
} );
$( window ).on( 'drop', ( ev ) =>{
    return cancelEvent( ev );
} );

document.title = 'NicoLive Helper X';
