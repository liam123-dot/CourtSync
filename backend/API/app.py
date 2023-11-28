from create_app import create_app

app, db_connection = create_app()

@app.route('/')
def health_check():
    return 'OK', 200

if __name__ == '__main__':
    app.run(debug=True)