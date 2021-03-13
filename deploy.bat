:: just to get us all at the same starting point
git checkout master

:: create a 'dist' directory checked out to the gh-pages branch
git worktree add -B gh-pages dist origin/gh-pages

:: buld the project
npm run build

:: cd into 'dist' folder, which is now on the gh-pages branch
cd dist

:: fail if for some reason this isn't the gh-pages branch
current_branch=$(git symbolic-ref --short -q HEAD)
if [ "$current_branch" != "gh-pages" ]; then
  echo "Expected dist folder to be on gh-pages branch."
  exit 1
fi

:: commit and push to gh-pages
git add . && git commit -m "Update gh-pages"
git push