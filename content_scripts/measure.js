(function(){
    // console.log( document.location.href );

    // 艦これの表示座標を外部から取得できないのでcontent scriptで定期的にbackground scriptに送信
    // 2ヶ所から座標取得しないといけないのでスクショ撮影時に tabs.executeScript ではうまくいくか不明（試してない）

    let f = ( ev ) =>{
        if( document.location.href.match( /dmm\.com\/netgame\/social\/-\/gadgets\/=\/app_id=854854/ ) ){
            let game_frame = document.getElementById( "game_frame" );
            if( !game_frame ) return null;
            let rect = game_frame.getBoundingClientRect();
            let offset_x = rect.x + window.pageXOffset;
            let offset_y = rect.y + window.pageYOffset;

            // console.log( `${offset_x}, ${offset_y}` );
            browser.runtime.sendMessage( {
                cmd: 'set-game-position',
                value: {
                    offset_x: offset_x,
                    offset_y: offset_y,
                    scroll_x: window.scrollX,
                    scroll_y: window.scrollY
                }
            } )
        }

        if( document.location.href.match( /aid=854854/ ) ){
            let flash = document.getElementsByTagName( "embed" )[0];
            let offset_x = flash.offsetLeft;
            let offset_y = flash.offsetTop;

            let w = flash.clientWidth;
            let h = flash.clientHeight;

            // console.log( `${offset_x}, ${offset_y}, ${w}x${h}` );
            browser.runtime.sendMessage( {
                cmd: 'set-flash-position',
                value: {
                    offset_x: offset_x,
                    offset_y: offset_y,
                    w: w,
                    h: h
                }
            } )
        }
    };

    setInterval( ( ev ) =>{
        f();
    }, 2000 );

    browser.runtime.onMessage.addListener( ( request ) =>{
        document.title = request.title;
        return Promise.resolve( {} );
    } );
})();

