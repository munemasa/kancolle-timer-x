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
let KanColle = {};

let ResourceGraph = {
    color: {
        "fuel": "#69aa60",
        "bullet": "#ccbf8e",
        "steel": "#6d6d6d",
        "bauxite": "#e6a97a",
        "bucket": "#8888ff"
    },


    createGraph: function(){
        RemoveElement( document.querySelector( '#graph' ) );

        let data = KanColle.resourcelog.filter( ( e ) =>{
            return true;
        } );

        this.width = 800;
        this.height = 480;

        let margin = {top: 20, right: 80, bottom: 42, left: 50};
        let width = this.width - margin.left - margin.right;
        let height = this.height - margin.top - margin.bottom;

        // バケツだけ縦軸のスケールが違うので hoge2 として区別する
        let x = d3.scaleTime().rangeRound( [0, width] );
        let y = d3.scaleLinear().rangeRound( [height, 0] );
        let y2 = d3.scaleLinear().rangeRound( [height, 0] );

        // let xAxis = d3.svg.axis().scale( x ).orient( "bottom" ).tickFormat( d3.time.format( "%m/%d %H:%M" ) );
        // let yAxis = d3.svg.axis().scale( y ).orient( "left" );
        // let yAxis2 = d3.svg.axis().scale( y2 ).orient( "left" );

        let line = d3.line()
            .x( function( d ){
                return x( d.date );
            } )
            .y( function( d ){
                return y( d.value );
            } )
            .curve( d3.curveStepAfter );
        let line2 = d3.line()
            .x( function( d ){
                return x( d.date );
            } )
            .y( function( d ){
                d.value = d.value || 0;
                return y2( d.value );
            } )
            .curve( d3.curveStepAfter );

        let w = width + margin.left + margin.right;
        let h = height + margin.top + margin.bottom;
        let svg = d3.select( "#d3graph" ).append( "svg" ).attr( "id", "graph" )
            .attr( "width", w )
            .attr( "height", h )
            .attr( "viewBox", "0 0 " + w + " " + h )
            .append( "g" )
            .attr( "transform", "translate(" + margin.left + "," + margin.top + ")" );

        // データを資源ごとにまとめる
        let keys = d3.keys( data[data.length - 1] ).filter( function( k ){
            let ids = ["fuel", "bullet", "steel", "bauxite", "bucket"];
            for( let i = 0; i < ids.length; i++ ){
                // if( !$( ids[i] ).checked && k == ids[i] ){
                //     return false;
                // }
            }
            return k !== "record_time" && k !== "date";
        } );

        data.forEach( function( d ){
            d.date = new Date( d.record_time * 60 * 1000 );
        } );
        let resources = keys.map( function( k ){
            return {
                name: k,
                values: data.map( function( d ){
                    return {date: d.date, value: +d[k]};
                } )
            };
        } );
        console.log( resources );

        x.domain( d3.extent( data, function( d ){
            return d.date;
        } ) );
        // バケツを無視して資源の最大、最小値を得る
        let min = d3.min( resources, function( r ){
            if( r.name == "bucket" ) return Number.MAX_VALUE;
            return d3.min( r.values, function( v ){
                return v.value;
            } );
        } );
        let max = d3.max( resources, function( r ){
            if( r.name == "bucket" ) return 0;
            return d3.max( r.values, function( v ){
                return v.value;
            } );
        } );
        min = d3.max( [min - 1000, 0] );
        max = max + 500;
        if( max > 300000 ){
            max = 300000;
        }
        y.domain( [min, max] );

        // バケツの最大、最小を得る
        min = d3.min( resources, function( r ){
            if( r.name != "bucket" ) return Number.MAX_VALUE;
            return d3.min( r.values, function( v ){
                return v.value;
            } );
        } );
        max = d3.max( resources, function( r ){
            if( r.name != "bucket" ) return 0;
            return d3.max( r.values, function( v ){
                return v.value;
            } );
        } );
        min = d3.max( [min - 50, 0] );
        max = d3.min( [3000, max + 50] );
        if( max > 3000 ){
            max = 3000;
        }
        y2.domain( [min, max] );

        svg.append( "g" )
            .attr( 'class', 'vertical-line' )
            .attr( "transform", `translate(0, ${height})` )
            .call( d3.axisBottom( x ).tickSizeInner( -height )
                .ticks(5)
                .tickFormat( ( d ) =>{
                    let str = GetDateString( d.getTime() );
                    return str.substring( 0, str.length - 3 );
                } ) );

        svg.append( "g" )
            .attr( 'class', 'horizontal-line' )
            .call( d3.axisLeft( y )
                .tickSizeInner( -width ).tickSizeOuter( 0 )
            );

        svg.append( "g" )
            .attr( 'class', 'horizontal-line' )
            .attr( 'transform', `translate( ${width}, 0)` )
            .call( d3.axisLeft( y2 )
            );

        // 折れ線グラフの作成
        let resource = svg.selectAll( ".resource" )
            .data( resources )
            .enter().append( "g" )
            .attr( "class", "resource" );

        resource.append( "path" )
            .attr( "class", "line" )
            .attr( "d", function( d ){
                if( d.name == "bucket" ){
                    return line2( d.values );
                }
                return line( d.values );
            } )
            .style( "stroke", function( d ){
                return ResourceGraph.color[d.name];
            } );

        // 現在値の位置にラベルを表示
        let resource_name = {
            "fuel": "燃料",
            "bullet": "弾薬",
            "steel": "鋼材",
            "bauxite": "ボーキサイト",
            "bucket": "バケツ"
        };

        // ラベルの表示位置を事前計算
        let ypos = [];
        for( let i = 0; i < resources.length; i++ ){
            let t = {};
            t.name = resources[i].name;
            let v = resources[i].values[resources[i].values.length - 1].value;
            if( resources[i].name == "bucket" ){
                t.value = y2( v )
            }else{
                t.value = y( v );
            }
            ypos.push( t );
        }
        // 上から順に並べ替え
        ypos.sort( function( a, b ){
            return a.value - b.value;
        } );

        ypos[ypos[0].name] = ypos[0].value;
        // 重ならないように位置をずらす
        for( let i = 1; i < ypos.length; i++ ){
            let y1 = ypos[i - 1].value;
            let y2 = ypos[i].value;
            // 文字サイズが12px指定になっているので即値で12を使用
            if( y2 <= y1 + 12 ){
                ypos[i].value = y1 + 12;
            }
            ypos[ypos[i].name] = ypos[i].value;
        }

        resource.append( "text" )
            .datum( function( d ){
                return {name: d.name, value: d.values[d.values.length - 1]};
            } )
            .attr( "transform",
                function( d ){
                    let y_tmp = ypos[d.name];
                    return "translate(" + x( d.value.date ) + "," + y_tmp + ")";
                } )
            .attr( "x", 3 )
            .attr( "dy", ".35em" )
            .text( function( d ){
                return resource_name[d.name];
            } );
    },

    init: async function(){
        let bg = await browser.runtime.getBackgroundPage();
        KanColle = bg.GetKanColle();

        this.createGraph();
    }
};


window.addEventListener( 'load', ( ev ) =>{
    ResourceGraph.init();
} );