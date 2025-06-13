# Path to Jest config file supplied by VSCode Jest Runner
jest_config=$3

# Remove part after last slash
cwd=$(echo "$jest_config" | sed 's|\(.*\)/.*|\1|')
cd "$cwd"

type=$(echo "$1" | sed 's/.*\/__tests__\///' | sed 's/\/.*//')

testScriptName() {
  if [ "$type" = "unit" ]; then
    echo "test"
  else
    echo "test:$type"
  fi
}

command="npm run $(testScriptName) -- $1 -t '$5'"
eval "$command"
