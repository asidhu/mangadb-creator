
#include <node.h>
#include <v8.h>
#include "algorithm.h"

using namespace v8;


void js2hash(Handle<Object> obj, hash& h){
	Handle<Array> hash1 = Handle<Array>::Cast(obj->Get(String::New("major_hash")));
	for (int i = 0; i < HASH1NUMBINS; i++)
		h.hist_major[i]= (float)hash1->Get(i)->ToNumber()->NumberValue();

	//Handle <Array> hash2 = Handle<Array>::Cast(obj->Get(String::New("minor_hash_which")));
	Handle <Array> hash3 = Handle<Array>::Cast(obj->Get(String::New("minor_hash")));
	for (int i = 0; i < NUMBINS; i++){
		//Handle<Array> a = Handle<Array>::Cast(hash2->Get(i));
		Handle<Array> b = Handle<Array>::Cast(hash3->Get(i));
		for (int j = 0; j < NUMMAX; j++){
			h.hist_minor[i][j] = std::pair<HASH2INTTYPE, HASH2INTBOXES>();
			//h.hist_minor[i][j].first = a->Get(j)->Uint32Value();
			h.hist_minor[i][j].second = b->Get(j)->Uint32Value();
		}
	}
}
void hash2js(Handle<Object> hash_obj, hash& h){
	Handle<Array> hash1 = Array::New(HASH1NUMBINS);
	for (int i = 0; i < HASH1NUMBINS; i++)
		hash1->Set(i, Number::New(h.hist_major[i]));

	//Handle <Array> hash2 = Array::New(NUMBINS);
	Handle <Array> hash3 = Array::New(NUMBINS);
	for (int i = 0; i < NUMBINS; i++){
		//Handle<Array> a = Array::New(NUMMAX);
		Handle<Array> b = Array::New(NUMMAX);
		for (int j = 0; j < NUMMAX; j++){
			//a->Set(j, Integer::NewFromUnsigned(h.hist_minor[i][j].first));
			b->Set(j, Integer::NewFromUnsigned(h.hist_minor[i][j].second));
		}
		//hash2->Set(i, a);
		hash3->Set(i, b);
	}

	hash_obj->Set(String::New("major_hash"), hash1);
	//hash_obj->Set(String::New("minor_hash_which"), hash2);
	hash_obj->Set(String::New("minor_hash"), hash3);	
}
Handle<Value> HashDistance(const Arguments& args) {
	HandleScope scope;
	if (args.Length() < 2)
		return scope.Close(Undefined());
	if (!args[0]->IsObject())
		return scope.Close(Undefined());
	if (args[1]->IsObject()){
		Handle<Object> arg1 = (args[0]->ToObject());
		Handle<Object> arg2 = (args[1]->ToObject());
		hash a, b;
		js2hash(arg1, a);
		js2hash(arg2, b);
		double dist = distance_accurate(a, b);
		if (dist == -1)
			return scope.Close(Undefined());
		return scope.Close(Number::New(dist));
	}
	if (args[1]->IsArray()){
		Handle<Object> arg1 = (args[0]->ToObject());
		Handle<Array> arg2 = Local<Array>::Cast(args[1]);
		Handle<Array> ret = Array::New(arg2->Length());
		for (int i = 0; i < arg2->Length(); i++){
			if (!arg2->Get(i)->IsObject())
			{
				ret->Set(i, Undefined());
			}
			else{
				hash a, b;
				js2hash(arg1, a);
				js2hash(arg2->Get(i)->ToObject(), b);
				double dist = distance_accurate(a, b);
				if (dist == -1)
					ret->Set(i, Undefined());
				else
					ret->Set(i, Number::New(dist));
			}
		}
		return scope.Close(ret);
	}
	return scope.Close(Undefined());
}


Handle<Value> hashImage(char* img){
	hash x;
	cv::Mat m1 = cv::imread(img);
	if (!m1.data)
		return (Undefined());
	imghash_algorithm(m1, x);

	Local<Object> obj = Object::New();
	hash2js(obj, x);
	return obj;
}


Handle<Value> ImgHash(const Arguments& args) {
	HandleScope scope;
	if (args.Length() < 1)
		return scope.Close(Undefined());
	if (args[0]->IsArray()){
		Handle<Array> arr = Local<Array>::Cast(args[0]);
		Handle<Array> output = Array::New(arr->Length());
		for (int i = 0; i < arr->Length(); i++){
			if (arr->Get(i)->IsString()){
				v8::String::Utf8Value str(arr->Get(i));
				char* file1 = *str;
				output->Set(i, hashImage(file1));
			}
			else
				output->Set(i, Undefined());
		}
		return scope.Close(output);
	}
	else if (args[0]->IsString()){
		v8::String::Utf8Value arg1(args[0]->ToString());
		char* file1 = *arg1;
		hash x;
		cv::Mat m1 = cv::imread(file1);
		if (!m1.data)
			return scope.Close(Undefined());
		imghash_algorithm(m1, x);

		Local<Object> obj = Object::New();
		hash2js(obj, x);
		return scope.Close(hashImage(file1));
	}
	return scope.Close(Undefined());
}


void init(Handle<Object> exports) {
	exports->Set(String::NewSymbol("hashdist"),
		FunctionTemplate::New(HashDistance)->GetFunction());
	exports->Set(String::NewSymbol("imghash"),
		FunctionTemplate::New(ImgHash)->GetFunction());
}

NODE_MODULE(imghash, init)