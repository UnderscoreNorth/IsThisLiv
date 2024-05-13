<script lang='ts'>
    export let pos:string;
    let color1:string;
    let color2:string;
    switch(pos){
        case 'SS':
        case 'CF':
        case 'LWF':
        case 'RWF':
            color1='#D95F5F';
            color2='#C10000';
            break;
        case 'DMF':
        case 'CMF':
        case 'AMF':
        case 'LMF':
        case 'RMF':
            color1='#94D965';
            color2='#51B80C';
            break;
        case 'LB':
        case 'RB':
        case 'CB':
        case 'SB':
            color1='#6C9ED4';
            color2='#1861B0';
            break;
        case 'GK':
            color1='#E7D260';
            color2='#CCAD02';
            break;
    }
</script>
<div style="display:flex;width:45px;background-image: -moz-linear-gradient(top, #585858, #0E0E0E); background-image: -ms-linear-gradient(top, #585858, #0E0E0E); background-image: -o-linear-gradient(top, #585858, #0E0E0E); background-image: -webkit-linear-gradient(top, #585858, #0E0E0E); background-image: linear-gradient(top, #585858, #0E0E0E);border-top: 1px solid #7a7d82; border-bottom: 1px solid #7a7d82; border-radius: 4px;" >
    <div style="width:4px;background-image: -moz-linear-gradient(top, {color1}, {color2}); background-image: -ms-linear-gradient(top, {color1}, {color2}); background-image: -o-linear-gradient(top, {color1}, {color2}); background-image: -webkit-linear-gradient(top, {color1}, {color2}); background-image: linear-gradient(top, {color1}, {color2});; border-top-left-radius: 4px; border-bottom-left-radius: 4px;">&nbsp;
</div>
<div style="color:#FFF;text-align:center;flex-grow:1">{pos}
</div>
</div>