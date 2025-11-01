from setuptools import find_packages
from setuptools import setup

__version__ = "0.1.1"

# requirements.txt to stay up to date
with open("requirements.txt") as f:
    requirements = [
        line.strip() for line in f if line.strip() and not line.startswith("#")
    ]

setup(
    name="api",
    version=__version__,
    packages=find_packages(exclude=["tests"]),
    include_package_data=True,
    python_requires=">=3.8",
    install_requires=requirements,
)
