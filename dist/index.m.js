var n=function(n,e,i){this.tile=n,this.tiles_range=-1===n?Array.from(new Array(this.max_bin)).map(function(n,e){return e}):Array.from(new Array(n)).map(function(e,t){return Math.round(i*t/n)}),this.bin_length=e||0,this.max_bin=Number.isNaN(i)?-1:i};n.prototype.tiles=function(n){var e=this.tiles_range.length;return this.tiles_range.forEach(function(i,t){i<=n&&(e=t)}),e},n.prototype.tubeify=function(n){var e=this,i=[],t={},r=0;n.forEach(function(n){void 0===t[n.name]&&(t[n.name]={}),t[n.name][n.bin_id]=n,r<n.bin_id&&(r=n.bin_id)}),-1===this.max_bin&&(this.max_bin=r);var a=-1,s=-1;n.forEach(function(n){n.begins.forEach(function(t,r){s!==n.path_name?(a=0,s=n.path_name):a+=1;var o=[{nodeName:String(n.bin_id),mismatches:[]}];n.begins[r][0]!==n.bin_id-1&&-1!==n.begins[r][0]&&o[0].mismatches.push({type:"link",pos:0,seq:"L",query:n.begins[r][0]+1}),n.ends[r][0]!==n.bin_id+1&&-1!==n.ends[r][0]&&o[0].mismatches.push({type:"link",pos:e.bin_length,seq:"L",query:n.ends[r][0]+1}),i.push({firstNodeOffset:0,finalNodeCoverLength:e.bin_length,mapping_quality:60,is_secondary:!1,sequence:[String(n.bin_id)],sequenceNew:o,type:"read",name:n.path_name,id:a})})});var o={},h=Array.from(new Array(this.max_bin)).map(function(n,i){return{name:String(i+1),sequenceLength:e.bin_length}});return o.nodes=h,o.tracks=[{id:0,name:"REF",sequence:h.map(function(n){return n.name})}],o.reads=i,o};export{n as Tubeify};
//# sourceMappingURL=index.m.js.map
