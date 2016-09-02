from setuptools import setup

setup(
    name = 'hpoliced',
    packages = ['hpoliced'],
    version = '0.0.3',
    description = 'Turns HTTPolice into a web server',
    author = 'ActiveSphere',
    author_email = 'shinde.rohitt@gmail.com',
    license='MIT',

    url = 'https://github.com/activesphere/httpolice-devtool/hpoliced',

    install_requires=[
        'httpolice >= 0.2.0',
        'bottle >= 0.12.9',
    ],

    entry_points = {
        'console_scripts': [
            'hpoliced=hpoliced.cli:main',
        ],
    },

    classifiers = [
        "Programming Language :: Python",
        "Intended Audience :: Developers",
        "Intended Audience :: Developers",
        "Development Status :: 4 - Beta",
        "Environment :: Console",
        "License :: OSI Approved :: MIT License",
        "Topic :: Internet :: WWW/HTTP",
        "Topic :: Internet :: WWW/HTTP :: WSGI :: Application",
        'Topic :: Software Development :: Quality Assurance',
    ],

    keywords = ['httpolice', 'http', 'lint', 'linting', 'tool']
)
