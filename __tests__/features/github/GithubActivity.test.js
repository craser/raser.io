import GithubActivity from "@/components/github/GithubActivity";
import { ModalProvider } from "@/components/modal/ModalProvider";
import { render } from "@testing-library/react";

async function renderScaffold() {
    return render(
        <ModalProvider>
            <GithubActivity/>
        </ModalProvider>
    )
}

jest.mock('lucide-react', () => {
    return {
        Github: () => <b>github icon</b>,
        File: () => <b>file icon</b>,
        ChevronUp: () => <b>chevron up icon</b>,
        ChevronDown: () => <b>chevron down icon</b>
    }
})

jest.mock('@/components/LoadingSpinner', () => {
    return {
        __esModule: true,
        default: () => <b>loading spinner</b>
    }
});

describe('GithubActivity', () => {

    beforeEach(() => {
        jest.resetAllMocks();
        global.fetch = jest.fn().mockImplementation((url) => {
            return Promise.resolve({
                ok: true,
                json: jest.fn().mockResolvedValue({ repos: [] }),
            });
        });
    });

    it('should render without error', async () => {
        expect.assertions(1);
        const result = await renderScaffold();
        expect(result).not.toBe(null);
    });

    it('should fetch recent github activity', async () => {
        expect.assertions(1);
        await renderScaffold();
        expect(global.fetch).toHaveBeenCalledWith('/api/github/recent');
    });

    it('should list each repo with commits', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                repos: [
                    {
                        name: 'repo1',
                        url: 'repo1_url',
                        description: 'repo1_description',
                        commits: [
                            {
                                message: 'commit1_message',
                                date: new Date().toString(),
                                hash: 'commit1_hash',
                                url: 'commit1_url'
                            },
                            {
                                message: 'commit2_message',
                                date: new Date().toString(),
                                hash: 'commit2_hash',
                                url: 'commit2_url'
                            },
                            {
                                message: 'commit3_message',
                                date: new Date().toString(),
                                hash: 'commit3_hash',
                                url: 'commit3_url'
                            },
                        ]
                    }
                ]
            }),
        });

        const result = await renderScaffold();
        expect(result).not.toBe(null);
    });

    it('should show 3 commits', () => {

    });

    it('should show the readme when the readme button is clicked', () => {

    });

    it('should hide the readme button when there is an error fetching the readme', () => {

    });




});
