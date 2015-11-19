## Generating the GIFs in this directory

Converting .mov files to .gif files using the ffmpeg CLI:

```bash
ffmpeg -i ~/Desktop/lazytree-demo-domviz.mov -s 359x380 -filter:v "setpts=0.5*PTS" -t 5 -f gif - | gifsicle --optimize=3 > lazytree-demo-domviz.gif
```


