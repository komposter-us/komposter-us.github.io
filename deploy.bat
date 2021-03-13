# just to get us all at the same starting point
git checkout master

# delete your dist folder
rm -rf dist

# create a 'dist' directory checked out to the gh-pages branch
git worktree add -B gh-pages dist origin/gh-pages

# dist the project
bundle exec rake dist

# cd into 'dist' folder, which is now on the gh-pages branch
cd dist