:: just to get us all at the same starting point
git checkout master

:: buld the project
npm run build

:: commit and push to gh-pages
git add dist
git commit -m "Update gh-pages"
git subtree push --prefix dist origin gh-pages
pause

