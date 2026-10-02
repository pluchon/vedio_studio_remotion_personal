# 从两张 21600 见方的 Blue Marble 里裁出亚马逊流域，存成 north.png 和 south.png（由 build_data.py 调用）
param(
  [string]$Source,
  [string]$Target,
  [int]$X,
  [int]$Width,
  [int]$NorthHeight,
  [int]$SouthHeight
)

Add-Type -AssemblyName PresentationCore, WindowsBase

$jobs = @(
  @{ File = 'world.topo.bathy.200408.3x21600x21600.B1.jpg'; Y = 21600 - $NorthHeight; Height = $NorthHeight; Name = 'north.png' },
  @{ File = 'world.topo.bathy.200408.3x21600x21600.B2.jpg'; Y = 0; Height = $SouthHeight; Name = 'south.png' }
)

foreach ($job in $jobs) {
  $in = [IO.File]::OpenRead((Join-Path $Source $job.File))
  $decoder = [System.Windows.Media.Imaging.JpegBitmapDecoder]::new($in, 'PreservePixelFormat', 'None')
  $rect = [System.Windows.Int32Rect]::new($X, $job.Y, $Width, $job.Height)
  $crop = [System.Windows.Media.Imaging.CroppedBitmap]::new($decoder.Frames[0], $rect)
  $encoder = [System.Windows.Media.Imaging.PngBitmapEncoder]::new()
  $encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($crop))
  $out = [IO.File]::Create((Join-Path $Target $job.Name))
  $encoder.Save($out)
  $out.Close()
  $in.Close()
}
