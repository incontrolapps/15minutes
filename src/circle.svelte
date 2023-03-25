<script>
export let circleSize, letter, title
</script>

<circle
cx={circleSize}
cy={circleSize + 10}
r={circleSize}
fill="black" />
<text
x={circleSize}
y={circleSize * 1.9}
font-size={circleSize * 1.2}
font-weight="bold"
fill="white"
text-anchor="middle">
{letter}
</text>

    <foreignObject x={circleSize * 2.5} y={circleSize*-0.5} width="80%" height={circleSize*4}>
    <h2 xmlns="http://www.w3.org/1999/xhtml" style="line-height: 22px;">{title}</h2>
    </foreignObject>
