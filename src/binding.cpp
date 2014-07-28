
#include <node.h>
#include <v8.h>
#include "algorithm.h"

using namespace v8;

Handle<Value> ImgDistance(const Arguments& args) {
	HandleScope scope;
	if (args.Length() < 2)
		return scope.Close(Undefined());
	v8::String::Utf8Value arg1(args[0]->ToString());
	v8::String::Utf8Value arg2(args[1]->ToString());
	char* file1 = *arg1;
	char* file2 = *arg2;
	double dist = test(file1, file2);
	if (dist==-1)
		return scope.Close(Undefined());
	return scope.Close(Number::New(dist));
}


void init(Handle<Object> exports) {
	exports->Set(String::NewSymbol("imgdist"),
		FunctionTemplate::New(ImgDistance)->GetFunction());
}

NODE_MODULE(imghash, init)