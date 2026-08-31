Why do we need compression?
Efficient data storage 
It allows some file to be made smaller either using lossless and lossy compression.  WE want to make these images smaller so that we can more efficient store thati nformation basically will take up less space. If we dont want to lose quality
we can use these four:

Lossless compression - (PNG,TIFF) for storing high-resolution images to save space without quality loss.

Faster Data Transmission - Use lossy compression for streaming video content to ensure smooth playback with minimal buffering.

Backup and Archiving - Use lossless compression for regular data backups to reduce file size and save on storage and transfer time.

Optimized Web Performance-  Use compression to improve website load times and enhance user experience.


Lossless compression vs Lossy compression


-- Lossy compression:
- Removes data
- Smaller file size
- Irreversible
- Used when some data can be lost(videos, images, etc.)


-- Lossless compression:
Uses algorithm to reduce file size
Larger than lossy, but smaller than normal
Reversible
Used when no data can be lost(text, software, etc.)


6 (a) A real-time video of a music concert needs to be streamed to subscribers.

Tick one box to identify the most appropriate type of compression and justify your answer.

LOSSY     TICKED

LOSSLESS    BLANK


Justification - 
Loss of quality will not be noticed.
Needs to be viewed in real time so less bandwidth needed if file size smaller.
Smaller file sizes will reduce buffering so the video will play more smoothly.
Viewers may watch on different devices, so may not need high quality resolution.

(c) The photographs are compressed before they are uploaded to a web server. Customers download the photographs from this web server.

1) Explain the reasons why compressing the photographs will benefit the customers.
If you compress the photograph it takes up less bandwidth.
The customers will be able to download the photographs in less time.
The photograph will take up less space on the customer's storage, therefore the customers can store more images and will have more spaces for other files.


Run-Length Encoding(RLE)

A simple form of data compression where consecutive repeated values (runs) are stored as a single value and a count.

E.g: The sequence "AAAABBBCCDAA" would be encoded as "4A3B2C1D2A"

- Effective for compression data with many repeated elements.


RLE problem
Each colour of the pixel in the image is represented by a hexadecimal value.
UNCOMPRESSED            RLE COMPRESSED
EA F1 F1 F2 F2 F2 EA       1EA 2F1 3F2 1EA
AB AB FF FF 1D 67           2AB 2FF 11D 167
32 32 80 81 81                 232 180 281


An image can be compressed using RLE

Explain why the RLE may not reduce the file size of a bitmap image.
Give one example in your answer.
RLE stores a colour and the number of times it occurs consecutively.
An image may not have many sequences of the same colour.

It would need to store each colour and then the count which adds data.

Example:
Red-Green-Blue would become Red 1 Green 1 Blue 1
