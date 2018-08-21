import {parsePosixPath, WRONG_POSIX_PATH_ROOT, ERROR_FILEPATH_MUST_BE_ABSOLUTE, parseWindowsPath, joinPath} from './path-handling';

describe('Path handling', () => {
    describe('parsePosixPath', () => {
        it('should split a up a POSIX path into the mount point and rest of path', () => {
            const validPosixPath = '/mnt/c/Users/Bob';

            const [base, restOfPath] = parsePosixPath(validPosixPath);

            expect(base).toEqual('/mnt/c');
            expect(restOfPath).toEqual('/Users/Bob');
        });

        it('should throw an error when the path is not under /mnt/ ', () => {
            const invalidPosixPath = '/home/bob';
            expect.assertions(1);

            try {
                parsePosixPath(invalidPosixPath);
            } catch(e) {
                expect(e).toEqual(Error(WRONG_POSIX_PATH_ROOT));
            }
        });
    });

    describe('parseWindowsPath', () => {
        it('should split a up a Windows path into the mount point and rest of path', () => {
            const validWindowPath = 'C:\\Users\\Bob';

            const [base, restOfPath] = parseWindowsPath(validWindowPath);

            expect(base).toEqual('C:\\');
            expect(restOfPath).toEqual('Users\\Bob');
        });

        it('should throw an error when a path is not absolute ', () => {
            const invalidWindowsPath = 'Users\\Bob';
            expect.assertions(1);

            try {
                parseWindowsPath(invalidWindowsPath);
            } catch(e) {
                expect(e).toEqual(Error(ERROR_FILEPATH_MUST_BE_ABSOLUTE));
            }
        });
    });

    describe('joinPath', () => {

        it('joins POSIX paths and normalizes them', () => {
            const joined = joinPath('/mnt/c', 'Users/Bob ');

            expect(joined).toEqual('/mnt/c/Users/Bob');
        });

        it('joins windows  paths and normalizes them', () => {
            const joined = joinPath('C:\\', 'Users\\Bob ', true);

            expect(joined).toEqual('C:\\Users\\Bob');
        });
    })

});