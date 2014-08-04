
#include "algorithm.h"
#include <stdio.h>
#include <cstdlib>
#include <utility>
#include <algorithm>




//algorithm v2
/*
	multi part hash.
	1st part
	gray scale
	white and black normalization
	calculate histogram of whole image, and store number of pixels for each of x bins.
	These are indexed in mongodb and can be searched for by range in mongodb as pruning method.
	2nd part
	shrink image down to small size
	divide up into smaller chunks	
	histogram each of the chunks
	sort the largest pixels for each bin of each block
	record x number of blocks with large bins in hash.
	
	should match which bins were the biggest


*/

bool comp(std::pair<HASH2INTTYPE, HASH2INTBOXES> a, std::pair<HASH2INTTYPE, HASH2INTBOXES> b){
	return a.first > b.first;
}

bool comp2(std::pair<HASH2INTTYPE, HASH2INTBOXES> a, std::pair<HASH2INTTYPE, HASH2INTBOXES> b){
	return a.second < b.second;
}

void hash2string(char* str, const hash& h){
	//convert first part to str
	for (int i = 0; i < HASH1NUMBINS; i++){
		int x;
		x = sprintf(str, "%04X", h.hist_major[i]);
		str += x;
	}

	//convert 2nd part to str
	for (int i = 0; i < NUMBINS; i++){
		for (int j = 0; j < NUMMAX; j++){
			int x;
			x = sprintf(str, "%02X", h.hist_minor[i][j].first);
			str += x;
		}
	}
	for (int i = 0; i < NUMBINS; i++){
		for (int j = 0; j < NUMMAX; j++){
			int x;
			x = sprintf(str, "%04X", h.hist_minor[i][j].second);
			str += x;
		}
	}
}

void string2hash(char* str, const hash& h){
	//convert first part to str
	for (int i = 0; i < HASH1NUMBINS; i++){
		int x;
		x = sscanf(str, "%04X", &(h.hist_major[i]));
		str += x;
	}

	//convert 2nd part to str
	for (int i = 0; i < NUMBINS; i++){
		for (int j = 0; j < NUMMAX; j++){
			int x;
			x = sscanf(str, "%02X", &(h.hist_minor[i][j].first));
			str += x;
		}
	}
	for (int i = 0; i < NUMBINS; i++){
		for (int j = 0; j < NUMMAX; j++){
			int x;
			x = sscanf(str, "%04X", &(h.hist_minor[i][j].second));
			str += x;
		}
	}
}
void imghash_algorithm(cv::Mat in, hash &hash){
	cv::Mat small;
	cv::cvtColor(in, in, CV_BGR2GRAY);
	//normalize

	double min, max;
	//cv::minMaxLoc(in, &min, &max);

	//in = (in - min) * (255.0 / (max - min));
	//cv::minMaxLoc(small, &min, &max);

	cv::resize(in, small, cv::Size(HASH2IMGSIZE, HASH2IMGSIZE), 0, 0, cv::INTER_CUBIC);
	cv::GaussianBlur(small, small, cv::Size(7, 7), 1.5f, 1.5f);
	//cv::threshold(small, small, 120, 255, cv::THRESH_BINARY);
	cv::MatND hist;
	int channels = 0;
	int histSize[] = { HASH1NUMBINS };
	float ranges[] = { 0, 256 };
	const float* range_c[] = { ranges };
	cv::calcHist(&(in), 1, &channels, cv::Mat(), hist, 1, histSize, range_c);
	//calculate 1st part of hash
	int64_t total = in.size[0] * in.size[1];
	for (int i = 0; i < HASH1NUMBINS; i++){
		hash.hist_major[i] = (float_t)((double_t)hist.at<float>(i) / (double_t)total);
	}
	histSize[0] = NUMBINS;
	std::vector<std::pair<HASH2INTTYPE, HASH2INTBOXES>> hist_storage[NUMBINS];
	//HASH2INTTYPE hist_storage[NUMBINS][HASH2NUMBLOCKS];
	//calc histogram of 4x4 blocks
	for (int i = 0; i < HASH2NUMBLOCKS; i++){
		int x = i % HASH2WIDTH, y = i / HASH2WIDTH;
		cv::Mat block = small(cv::Rect(x * 4, y * 4, 4, 4));
		cv::calcHist(&(block), 1, &channels, cv::Mat(), hist, 1, histSize, range_c);
		for (int j = 0; j < NUMBINS; j++){
			hist_storage[j].push_back(std::pair<HASH2INTTYPE, HASH2INTBOXES>((HASH2INTTYPE)hist.at<float>(j),i));
		}
	}
	for (int j = 0; j < NUMBINS; j++){
		std::sort(hist_storage[j].begin(), hist_storage[j].end(),comp);
		hist_storage[j].erase(hist_storage[j].begin() + NUMMAX, hist_storage[j].end());
		std::sort(hist_storage[j].begin(), hist_storage[j].end(), comp2);
		for (int i = 0; i < NUMMAX; i++){
			hash.hist_minor[j][i] = hist_storage[j][i];
		}
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
	//hash c = a - b;
	//double mag = magnitude(c);
	return 0;
}

double distance_fast(hash a, hash b){
	//Quickly test distance from 1st part of hash
	float sumSq = 0;
	for (int i = 0; i < HASH1NUMBINS; i++){
		float dist = a.hist_major[i] - b.hist_major[i];
		sumSq += dist*dist;
	}
	return sqrtf(sumSq);
}


double distance_accurate(hash a, hash b){
	int numMatches = 0;
	for (int i = 0; i < NUMBINS; i++){
		int idx1 = 0, idx2 = 0;
		while (idx1 < NUMMAX && idx2 < NUMMAX){
			uint16_t x = a.hist_minor[i][idx1].second,
				y = b.hist_minor[i][idx2].second;
				//diff = std::abs(x - y);
			if (x < y)
				idx1++;
			else if (x>y)
				idx2++;
			else{
				numMatches++;
				idx1++;
				idx2++;
			}
		}
	}
	return (double)numMatches / (NUMBINS*NUMMAX);
}