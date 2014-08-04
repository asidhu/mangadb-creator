#include <inttypes.h>
#include "opencv2\opencv.hpp"

#define HASH1NUMBINS 2
#define NUMBINS 6
#define NUMMAX 30
#define HASH2INTTYPE uint8_t
#define HASH2INTBOXES uint8_t
#define HASH2IMGSIZE 128
#define HASH2NUMBLOCKS (HASH2IMGSIZE*HASH2IMGSIZE)/16
#define HASH2WIDTH (HASH2IMGSIZE/4)

#define HASHSTRLENGTH	(4*NUMBINS + 2*NUMBINS*NUMMAX + 4*NUMBINS*NUMMAX)

struct hash {
	float_t hist_major[HASH1NUMBINS];
	std::pair<HASH2INTTYPE, HASH2INTBOXES> hist_minor[NUMBINS][NUMMAX];
};
double test(char* x, char* y);
void imghash_algorithm(cv::Mat in, hash &hash);
double distance_fast(hash a, hash b);
double distance_accurate(hash a, hash b);
void string2hash(char* str, const hash& h);
void hash2string(char* str, const hash& h);