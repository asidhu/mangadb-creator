#include <inttypes.h>
#include "opencv2\opencv.hpp"

typedef struct { uint64_t  data[16]; } hash;
double test(char* x, char* y);
void imghash_algorithm(cv::Mat in, hash &hash);
double distance(hash a, hash b);