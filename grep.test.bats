 #!/usr/bin/env bats

@test "step 1 - empty" {
  cd $HOME/workspace
  run node grep.js "" test/rockbands.txt | diff test/rockbands.txt -
[ "$lines" = "" ]
}



@test "step 2 - includes J" {
  cd $HOME/workspace
  run node grep.js J test/rockbands.txt
  [ "$status" = 0 ] || {
    echo "status wrong" >&2
    return 1
  }
  
  [ "${#lines[@]}" -eq 3 ] || {
    echo "Test case failed: expected 3 lines but got ${#lines[@]} lines" >&2
    return 1
  }
  
  [ "${lines[0]}" == "Judas Priest" ] || {
    echo "Test case failed: should contain Judas Priest" >&2
    return 1
  }
}


@test "step 3 - recurse " {
  cd $HOME/workspace
  run node grep.js -r Nirvana test/*
  [ "$status" -eq 0 ] || {
    echo "status wrong" >&2
    return 1
  }
  
  [ "${#lines[@]}" -eq 4 ] || {
    echo "Test case failed: expected 4 lines but got ${#lines[@]} lines" >&2
    return 1
  }
  
}


@test "step 4 - negative " {
  cd $HOME/workspace
  run "node grep.js -r Nirvana test/rockbands.txt test/test-subdir/BFS1985.txt | node grep.js -v Madonna"
  [ $status -eq 0 ] || {
    echo "status wrong" >&2
    return 1
  }
  
  [ "${#lines[@]}" -eq 1 ] || {
    echo "Test case failed: expected 1 line but got ${#lines[@]} lines" >&2
    return 1
  }
  
}
