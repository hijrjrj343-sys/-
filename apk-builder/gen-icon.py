import struct, zlib, os

def make_png(w, h, r, g, b):
    row = bytes([r, g, b, 255]) * w
    raw = b'\x00'.join([row for _ in range(h)])
    raw = b'\x00' + row  # one row only if h=1 for speed
    # Actually let's use proper approach
    rows = b''
    for _ in range(h):
        rows += b'\x00' + bytes([r,g,b,255]) * w
    def c(t, d):
        crc = struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
        return struct.pack('>I', len(d)) + t + d + crc
    return (b'\x89PNG\r\n\x1a\n' +
            c(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) +
            c(b'IDAT', zlib.compress(rows)) +
            c(b'IEND', b''))

os.makedirs('/tmp/school-project/apk-builder/res', exist_ok=True)
for name, size in [('icon.png', 192), ('icon-192.png', 192)]:
    png = make_png(size, size, 13, 27, 42)
    path = f'/tmp/school-project/apk-builder/res/{name}'
    with open(path, 'wb') as f:
        f.write(png)
    print(f'{name}: {size}x{size} - {len(png)} bytes')

print('Done')
