
#include "algorithm.h"
#include <stdio.h>
#include <cstdlib>




hash operator-(hash a, hash b){
	hash c;
	for (int i = 0; i < 16; i++){
		uint64_t x = a.data[i];
		uint64_t y = b.data[i];
		uint64_t z = 0;
		for (int j = 0; j < 16; j++){
			unsigned char c1 = x & 0xF, c2 = y & 0xF;
			x >>= 4; y >>= 4;
			unsigned int sub = (unsigned int)std::abs(c1 - c2);
			z <<= 4;
			z |= sub;
		}

		for (int j = 0; j < 16; j++){
			c.data[i] <<= 4;
			c.data[i] |= z & 0xF;
			z >>= 4;
		}
	}
	return c;
}

hash operator-=(hash a, hash b){
	return a - b;
}



double magnitude(hash c){
	double mag = 0;
	for (int i = 0; i < 16; i++){
		uint64_t z = c.data[i];
		for (int j = 0; j < 16; j++){
			double c1 = (double)(z & 0xF);
			mag += (c1 / 16)*(c1 / 16);
			z >>= 4;
		}
	}
	return (mag) / 128;
	//return std::sqrt(mag / (8 * 16 * 15*15));
}

double distance(hash a, hash b){
	return magnitude(a - b);
}

void imghash_algorithm(cv::Mat in, hash &hash){
	cv::Mat small;
	cv::cvtColor(in, small, CV_BGR2GRAY);
	//normalize

	double min, max;
	cv::minMaxLoc(small, &min, &max);

	//small = (small - min) * (255.0 / (max - min));
	//cv::minMaxLoc(small, &min, &max);

	cv::resize(small, small, cv::Size(32, 32), 0, 0, cv::INTER_CUBIC);
	//cv::GaussianBlur(small, small, cv::Size(3, 3), .7f, .7f);
	//cv::threshold(small, small, 120, 255, cv::THRESH_BINARY);
	cv::MatND hist;
	int channels = 0;
	int histSize[] = { 4 };
	float ranges[] = { 0, 256 };
	const float* range_c[] = { ranges };
	uint64_t *bin1 = &(hash.data[0]), *bin2 = &(hash.data[4]), *bin3 = &(hash.data[8]), *bin4 = &(hash.data[12]);
	for (int i = 0; i < 16; i++){
		hash.data[i] = 0;
	}
	//calc histogram of 4x4 blocks
	for (int i = 0; i < 64; i++){
		int x = i % 8, y = i / 8;
		cv::Mat block = small(cv::Rect(x * 4, y * 4, 4, 4));
		cv::calcHist(&(block), 1, &channels, cv::Mat(), hist, 1, histSize, range_c);
		uint8_t a = (uint8_t)hist.at<float>(0), b = (uint8_t)hist.at<float>(1), c = (uint8_t)hist.at<float>(2), d = (uint8_t)hist.at<float>(3);
		a = (a>15 ? 15 : a);
		b = (b>15 ? 15 : b);
		c = (c>15 ? 15 : c);
		d = (d>15 ? 15 : d);
		bin1[i / 16] <<= 4;
		bin1[i / 16] |= (a);
		bin2[i / 16] <<= 4;
		bin2[i / 16] |= (b);
		bin3[i / 16] <<= 4;
		bin3[i / 16] |= (c);
		bin4[i / 16] <<= 4;
		bin4[i / 16] |= (d);
	}
}

double test(char* x, char* y){
	cv::Mat m1 = cv::imread(x);
	cv::Mat m2 = cv::imread(y);
	if (!m1.data || !m2.data)
		return -1;
	assert(m1.data);
	assert(m2.data);
	hash a, b;
	imghash_algorithm(m1, a);
	imghash_algorithm(m2, b);
	hash c = a - b;
	double mag = magnitude(c);
	return mag;
}