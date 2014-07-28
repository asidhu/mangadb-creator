{
  "targets": [{ 
      "target_name": "imghash"
      , "sources": [ 
			"src/binding.cpp",
			"src/algorithm.cpp"
        ]
      , 'libraries': [
          '<!@(pkg-config --libs opencv)'
        ]
        
      # For windows
      ,'include_dirs': [
          '<!@(pkg-config --cflags opencv)',
		  'src'
          ]
          
      , 'cflags': [
            '-Wall'
          ]
      , 'cflags!' : [ '-fno-exceptions']
      , 'cflags_cc!': [ '-fno-rtti',  '-fno-exceptions']
  }]
}